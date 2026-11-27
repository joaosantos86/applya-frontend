<script setup lang="ts">
/**
 * Importação de projetos e linguagens do GitHub para o currículo aberto.
 *
 * Fluxo: usuário → "Buscar" (GET da prévia, nada é gravado) → escolha dos
 * itens → "Adicionar ao currículo" (mescla no rascunho). Persistir continua
 * sendo o salvamento normal do editor. Cancelar não altera o rascunho.
 */
import { computed, ref, watch } from 'vue'
import { AtSign, ExternalLink, Info, RefreshCcw } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import { useToast } from '@/composables/useToast'
import { ApiError, NetworkError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { previewGitHubImport } from '@/lib/api/resumes'
import {
  hasProject,
  hasSkill,
  normalizeGitHubUsername,
  skillKey,
  usernameFromGitHubField,
} from '@/lib/resume/githubImport'
import { displayUrl, projectFromApi, skillFromApi } from '@/lib/resume/mapper'
import type { ResumeProject, ResumeSkill } from '@/lib/resume/types'
import { useResumesStore } from '@/stores/resumes'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useResumesStore()
const { notify } = useToast()

type Phase = 'idle' | 'loading' | 'done' | 'error'

interface Preview {
  username: string
  projects: ResumeProject[]
  skills: ResumeSkill[]
  truncated: boolean
}

interface ImportError {
  message: string
  retryable: boolean
}

const username = ref('')
const fieldError = ref<string | undefined>()
const phase = ref<Phase>('idle')
const preview = ref<Preview | null>(null)
const failure = ref<ImportError | null>(null)
const selectedProjectIds = ref<Set<string>>(new Set())
const selectedSkillKeys = ref<Set<string>>(new Set())

/**
 * Cada busca recebe um número; só a resposta da busca mais recente é
 * aplicada. Fechar o diálogo também invalida buscas em andamento.
 */
let requestSeq = 0

watch(
  () => props.open,
  (open) => {
    requestSeq++
    if (!open) return
    phase.value = 'idle'
    preview.value = null
    failure.value = null
    fieldError.value = undefined
    const suggested = usernameFromGitHubField(store.selectedResume.personal.github)
    if (suggested && !username.value) username.value = suggested
  },
)

function inResume(project: ResumeProject): boolean {
  return hasProject(store.selectedResume.projects, project)
}

function skillInResume(skill: ResumeSkill): boolean {
  return hasSkill(store.selectedResume.skills, skill)
}

function describeError(error: unknown, user: string): ImportError {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return { message: error.message, retryable: false }
      case 401:
        return { message: 'Sua sessão expirou. Entre novamente para importar.', retryable: false }
      case 404:
        return {
          message: `Não encontramos o perfil @${user} no GitHub. Confira o nome de usuário.`,
          retryable: false,
        }
      case 429:
        return {
          message: rateLimitMessage(error, 'Muitas importações seguidas. Aguarde um pouco.'),
          retryable: true,
        }
      case 502:
      case 503:
        return {
          message:
            error.code === 'github_rate_limited'
              ? 'O GitHub limitou as consultas no momento. Tente novamente mais tarde.'
              : 'Não foi possível consultar o GitHub agora. Tente novamente em instantes.',
          retryable: true,
        }
    }
  }
  if (error instanceof NetworkError) return { message: error.message, retryable: true }
  return {
    message: getUserFacingMessage(error, 'Não foi possível buscar os repositórios.'),
    retryable: true,
  }
}

async function search(): Promise<void> {
  const user = normalizeGitHubUsername(username.value)
  if (!user) {
    fieldError.value = 'Informe o usuário do GitHub.'
    return
  }
  fieldError.value = undefined

  const seq = ++requestSeq
  phase.value = 'loading'
  failure.value = null

  try {
    const result = await previewGitHubImport(user)
    if (seq !== requestSeq) return

    const projects = result.projects.map(projectFromApi).filter((item) => item.name.trim())
    const skills = result.skills.map(skillFromApi).filter((item) => item.name.trim())
    preview.value = { username: user, projects, skills, truncated: result.truncated }
    // Pré-seleciona o que ainda não está no currículo.
    selectedProjectIds.value = new Set(projects.filter((p) => !inResume(p)).map((p) => p.id))
    selectedSkillKeys.value = new Set(
      skills.filter((s) => !skillInResume(s)).map((s) => skillKey(s.name)),
    )
    phase.value = 'done'
  } catch (error) {
    if (seq !== requestSeq) return
    failure.value = describeError(error, user)
    phase.value = 'error'
  }
}

function toggleProject(id: string, checked: boolean): void {
  const next = new Set(selectedProjectIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedProjectIds.value = next
}

function toggleSkill(key: string, checked: boolean): void {
  const next = new Set(selectedSkillKeys.value)
  if (checked) next.add(key)
  else next.delete(key)
  selectedSkillKeys.value = next
}

const selectionCount = computed(() => selectedProjectIds.value.size + selectedSkillKeys.value.size)

const isEmpty = computed(
  () => !!preview.value && !preview.value.projects.length && !preview.value.skills.length,
)

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

function confirmImport(): void {
  if (!preview.value) return
  const projects = preview.value.projects.filter((p) => selectedProjectIds.value.has(p.id))
  const skills = preview.value.skills.filter((s) => selectedSkillKeys.value.has(skillKey(s.name)))
  const added = store.applyGitHubImport(projects, skills)

  const parts = [
    added.projects ? plural(added.projects, 'projeto', 'projetos') : '',
    added.skills ? plural(added.skills, 'habilidade', 'habilidades') : '',
  ].filter(Boolean)

  if (parts.length) {
    notify(`${parts.join(' e ')} adicionados ao rascunho. Salve para manter no currículo.`)
  } else {
    notify('Os itens escolhidos já estavam no currículo.', 'info')
  }
  emit('close')
}
</script>

<template>
  <AppModal
    :open="open"
    size="lg"
    title="Importar do GitHub"
    description="Busque seus repositórios públicos e escolha o que adicionar. Nada é salvo até você salvar o currículo."
    close-label="Fechar importação"
    @close="emit('close')"
  >
    <form class="flex items-start gap-2" novalidate @submit.prevent="search">
      <div class="min-w-0 flex-1">
        <AppInput
          v-model="username"
          label="Usuário do GitHub"
          hide-label
          placeholder="Usuário do GitHub"
          autocomplete="off"
          spellcheck="false"
          maxlength="100"
          :error="fieldError"
          @input="fieldError = undefined"
        >
          <template #leading>
            <AtSign class="size-4" aria-hidden="true" />
          </template>
        </AppInput>
      </div>
      <AppButton type="submit" :loading="phase === 'loading'">
        {{ phase === 'loading' ? 'Buscando…' : 'Buscar' }}
      </AppButton>
    </form>

    <div class="mt-5" aria-live="polite">
      <p v-if="phase === 'loading'" class="text-sm text-text-secondary">
        Consultando repositórios públicos…
      </p>

      <div v-else-if="phase === 'error' && failure" class="space-y-3">
        <FormAlert variant="error" :message="failure.message" />
        <AppButton v-if="failure.retryable" variant="outline" size="sm" @click="search">
          <RefreshCcw class="size-4" aria-hidden="true" />
          Tentar novamente
        </AppButton>
      </div>

      <template v-else-if="phase === 'done' && preview">
        <p
          v-if="preview.truncated"
          role="status"
          class="mb-4 flex items-start gap-2 rounded-md border border-border bg-subtle px-3 py-2.5 text-sm text-text-secondary"
        >
          <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          A lista é parcial: mostramos apenas parte dos repositórios de @{{ preview.username }}.
        </p>

        <p v-if="isEmpty" role="status" class="text-sm text-text-secondary">
          O perfil @{{ preview.username }} existe, mas não tem repositórios públicos elegíveis.
          Forks, arquivados e privados não são importados.
        </p>

        <template v-else>
          <fieldset v-if="preview.projects.length">
            <legend class="mb-2 text-sm font-medium text-text-primary">
              Projetos
              <span class="font-normal text-text-muted tabular-nums">
                · {{ preview.projects.length }}
              </span>
            </legend>
            <ul class="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              <li v-for="project in preview.projects" :key="project.id">
                <label
                  class="flex gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[input:enabled]:cursor-pointer has-[input:enabled]:hover:bg-subtle motion-reduce:transition-none"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 size-4 shrink-0 accent-primary"
                    :checked="selectedProjectIds.has(project.id)"
                    :disabled="inResume(project)"
                    @change="toggleProject(project.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="flex items-baseline justify-between gap-3">
                      <span class="truncate text-sm font-medium text-text-primary">
                        {{ project.name }}
                      </span>
                      <span v-if="inResume(project)" class="shrink-0 text-xs text-text-muted">
                        Já no currículo
                      </span>
                    </span>
                    <span
                      v-if="project.description"
                      class="mt-0.5 line-clamp-2 block text-sm text-text-secondary"
                    >
                      {{ project.description }}
                    </span>
                    <span
                      v-if="project.technologies.length || project.repository"
                      class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted"
                    >
                      <span v-if="project.technologies.length">
                        {{ project.technologies.join(' · ') }}
                      </span>
                      <a
                        v-if="project.repository"
                        :href="project.repository"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 underline decoration-border-strong underline-offset-2 hover:text-text-primary hover:decoration-text-primary"
                        :aria-label="`Abrir repositório ${project.name} em nova aba`"
                      >
                        {{ displayUrl(project.repository) }}
                        <ExternalLink class="size-3" aria-hidden="true" />
                      </a>
                    </span>
                  </span>
                </label>
              </li>
            </ul>
          </fieldset>

          <fieldset v-if="preview.skills.length" class="mt-5">
            <legend class="text-sm font-medium text-text-primary">Habilidades sugeridas</legend>
            <p class="mt-0.5 mb-2 text-xs text-text-muted">
              Linguagens principais dos repositórios. Entram na seção Habilidades.
            </p>
            <ul class="flex flex-wrap gap-2">
              <li v-for="skill in preview.skills" :key="skill.id">
                <label
                  class="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary has-[input:enabled]:cursor-pointer has-[input:enabled]:hover:bg-subtle has-[input:disabled]:text-text-muted"
                >
                  <input
                    type="checkbox"
                    class="size-3.5 accent-primary"
                    :checked="selectedSkillKeys.has(skillKey(skill.name))"
                    :disabled="skillInResume(skill)"
                    @change="
                      toggleSkill(skillKey(skill.name), ($event.target as HTMLInputElement).checked)
                    "
                  />
                  {{ skill.name }}
                  <span v-if="skillInResume(skill)" class="sr-only">(já no currículo)</span>
                </label>
              </li>
            </ul>
          </fieldset>
        </template>
      </template>
    </div>

    <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <AppButton variant="ghost" @click="emit('close')">Cancelar</AppButton>
      <AppButton :disabled="phase !== 'done' || selectionCount === 0" @click="confirmImport">
        Adicionar ao currículo
      </AppButton>
    </div>
  </AppModal>
</template>
