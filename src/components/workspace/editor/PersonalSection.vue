<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppInput from '@/components/ui/AppInput.vue'
import SectionCard from './SectionCard.vue'
import {
  GITHUB_PROFILE_PREFIX,
  githubProfileUrl,
  githubUserFromProfile,
} from '@/lib/resume/githubImport'
import { validatePersonal, type PersonalErrors } from '@/lib/resume/validation'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

const validation = computed(() => validatePersonal(resume.value.personal))

/**
 * Campos que o usuário já visitou. O erro só aparece depois que ele sai do
 * campo; antes disso, um campo vazio não é tratado como erro.
 */
const visited = reactive<Partial<Record<keyof PersonalErrors, boolean>>>({})

function markVisited(field: keyof PersonalErrors): void {
  visited[field] = true
}

const errors = computed<PersonalErrors>(() => {
  const shown: PersonalErrors = {}
  for (const field of Object.keys(validation.value) as (keyof PersonalErrors)[]) {
    if (visited[field]) shown[field] = validation.value[field]
  }
  return shown
})

// Outro currículo aberto: começa sem erros exibidos.
watch(
  () => resume.value.id,
  () => {
    for (const field of Object.keys(visited) as (keyof PersonalErrors)[]) delete visited[field]
  },
)

/**
 * O endereço do GitHub é fixo: o campo mostra e edita só o usuário, e o
 * currículo guarda a URL completa ("https://github.com/<usuário>").
 */
const githubUser = computed({
  get: () => githubUserFromProfile(resume.value.personal.github),
  set: (value: string) => {
    resume.value.personal.github = githubProfileUrl(value)
  },
})
</script>

<template>
  <SectionCard
    id="resume-section-personal"
    title="Dados pessoais"
    description="Como você quer ser apresentado no currículo."
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput
        v-model="resume.personal.fullName"
        label="Nome completo"
        autocomplete="name"
        placeholder="Seu nome"
        :error="errors.fullName"
        @blur="markVisited('fullName')"
        required
      />
      <AppInput
        v-model="resume.personal.headline"
        label="Título profissional"
        placeholder="Ex.: Desenvolvedor Full Stack"
      />
      <AppInput
        v-model="resume.personal.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        placeholder="voce@exemplo.com"
        :error="errors.email"
        @blur="markVisited('email')"
      />
      <AppInput
        v-model="resume.personal.phone"
        label="Telefone"
        type="tel"
        autocomplete="tel"
        placeholder="(11) 99999-9999"
        :error="errors.phone"
        @blur="markVisited('phone')"
      />
      <AppInput
        v-model="resume.personal.location"
        label="Cidade e estado"
        placeholder="São Paulo, SP"
      />
      <AppInput v-model="resume.personal.website" label="Site pessoal" placeholder="seusite.dev" />
      <AppInput
        v-model="resume.personal.linkedin"
        label="LinkedIn"
        placeholder="linkedin.com/in/seu-perfil"
      />
      <!-- Linha inteira: o prefixo fixo ocupa boa parte da largura. -->
      <div class="sm:col-span-2">
        <AppInput
          v-model="githubUser"
          label="GitHub"
          :prefix="GITHUB_PROFILE_PREFIX"
          placeholder="seu-usuario"
          autocomplete="off"
          spellcheck="false"
          :error="errors.github"
          @blur="markVisited('github')"
        />
      </div>
    </div>
  </SectionCard>
</template>
