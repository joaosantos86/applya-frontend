<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileText,
  Layers,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from '@lucide/vue'

import ActiveDot from '@/components/ui/ActiveDot.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { getInitials, formatUpdatedAt } from '@/lib/resume/format'
import type { Resume, ResumeSummary } from '@/lib/resume/types'
import { useResumesStore } from '@/stores/resumes'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import VersionNameDialog from './VersionNameDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useResumesStore()
const auth = useAuthStore()
const router = useRouter()
const { notify } = useToast()

const initials = computed(() => (auth.user ? getInitials(auth.user.name) : 'AP'))

/** A sidebar só é exibida com o workspace carregado (base presente). */
const baseResume = computed(() => store.base as Resume)

const createOpen = ref(false)
const editingVersion = ref<ResumeSummary | null>(null)
const deletingVersion = ref<ResumeSummary | null>(null)
const confirmLogout = ref(false)
const submitting = ref(false)

async function selectResume(id: string) {
  if (props.open) emit('close')
  const result = await store.selectResume(id)
  if (!result.ok) notify(result.error, 'error')
}

async function onCreateSubmit(name: string) {
  if (submitting.value) return
  submitting.value = true
  const result = await store.createVersion(name)
  submitting.value = false

  if (result.ok) {
    createOpen.value = false
    notify(`Versão “${result.value.name}” criada a partir do currículo-base.`)
  } else {
    notify(result.error, 'error')
  }
}

async function onRenameSubmit(name: string) {
  const target = editingVersion.value
  if (!target || submitting.value) return
  submitting.value = true
  const result = await store.renameVersion(target.id, name)
  submitting.value = false

  if (result.ok) {
    editingVersion.value = null
    notify(`Versão renomeada para “${name.trim()}”.`)
  } else {
    notify(result.error, 'error')
  }
}

async function onDeleteConfirm() {
  const target = deletingVersion.value
  if (!target) return
  deletingVersion.value = null

  const result = await store.deleteVersion(target.id)
  if (result.ok) notify(`Versão “${target.name}” excluída.`, 'info')
  else notify(result.error, 'error')
}

function openSettings() {
  notify('Configurações estarão disponíveis em breve.', 'info')
}

function requestLogout() {
  if (store.hasUnsavedChanges) confirmLogout.value = true
  else void onLogout()
}

async function onLogout() {
  confirmLogout.value = false
  if (auth.loading) return
  await auth.logout()
  store.reset()
  await router.push({ name: 'login' })
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-border bg-background transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0"
    :class="
      open ? 'translate-x-0 shadow-lg lg:shadow-none' : 'invisible -translate-x-full lg:visible'
    "
    aria-label="Barra lateral do workspace"
  >
    <header class="flex h-12 shrink-0 items-center justify-between gap-3 px-4">
      <AppWordmark />

      <button
        type="button"
        class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        aria-label="Fechar menu"
        @click="emit('close')"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </header>

    <nav class="flex-1 overflow-y-auto px-2 pt-2 pb-4" aria-label="Currículos">
      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        :class="
          store.isBaseSelected
            ? 'bg-subtle font-medium text-text-primary'
            : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
        "
        :aria-current="store.isBaseSelected ? 'true' : undefined"
        :title="`Atualizado ${formatUpdatedAt(baseResume.updatedAt)}`"
        @click="selectResume(baseResume.id)"
      >
        <FileText class="size-4 shrink-0 text-text-muted" aria-hidden="true" />
        <span class="truncate">{{ baseResume.name }}</span>
        <ActiveDot v-if="store.isBaseSelected" />
      </button>

      <div class="mt-6 mb-1 flex h-6 items-center justify-between px-2">
        <p class="text-xs font-medium text-text-muted">Versões</p>
        <span class="text-xs text-text-muted tabular-nums" aria-label="Total de versões">
          {{ store.versionCount }}
        </span>
      </div>

      <ul v-if="store.versions.length" class="space-y-0.5">
        <li v-for="version in store.versions" :key="version.id" class="group relative">
          <button
            type="button"
            class="flex h-8 w-full items-center gap-2 rounded-md pr-16 pl-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
            :class="
              store.selectedId === version.id
                ? 'bg-subtle font-medium text-text-primary'
                : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
            "
            :aria-current="store.selectedId === version.id ? 'true' : undefined"
            :title="`Atualizado ${formatUpdatedAt(version.updatedAt)}`"
            @click="selectResume(version.id)"
          >
            <LoaderCircle
              v-if="store.openingId === version.id"
              class="size-4 shrink-0 animate-spin text-text-muted motion-reduce:animate-none"
              aria-hidden="true"
            />
            <Layers v-else class="size-4 shrink-0 text-text-muted" aria-hidden="true" />
            <span class="truncate">{{ version.name }}</span>
            <ActiveDot v-if="store.selectedId === version.id" />
          </button>

          <!-- Ações aparecem no hover/foco; sempre visíveis em telas sem hover. -->
          <div
            class="absolute inset-y-0 right-1 flex items-center opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100"
          >
            <button
              type="button"
              class="rounded p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              :aria-label="`Renomear versão ${version.name}`"
              title="Renomear"
              @click="editingVersion = version"
            >
              <Pencil class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              :aria-label="`Excluir versão ${version.name}`"
              title="Excluir"
              @click="deletingVersion = version"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </li>
      </ul>

      <p v-else class="px-2 py-2 text-xs leading-relaxed text-text-muted">
        Nenhuma versão ainda. Crie a primeira a partir do currículo-base.
      </p>

      <button
        type="button"
        class="mt-0.5 flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        @click="createOpen = true"
      >
        <Plus class="size-4 shrink-0 text-text-muted" aria-hidden="true" />
        Nova versão
      </button>
    </nav>

    <footer class="shrink-0 space-y-1 border-t border-border p-2">
      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        @click="openSettings"
      >
        <Settings class="size-4 text-text-muted" aria-hidden="true" />
        <span class="flex-1 text-left">Configurações</span>
        <span class="text-xs text-text-muted">Em breve</span>
      </button>

      <div class="flex items-center gap-2 rounded-md px-2 py-1.5">
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[11px] font-medium text-text-secondary"
          aria-hidden="true"
        >
          {{ initials }}
        </span>

        <div class="min-w-0 flex-1 leading-tight">
          <p class="truncate text-sm font-medium text-text-primary">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-text-muted">{{ auth.user?.email }}</p>
        </div>

        <ThemeToggle />

        <button
          type="button"
          class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
          aria-label="Sair da conta"
          title="Sair da conta"
          @click="requestLogout"
        >
          <LogOut class="size-4" aria-hidden="true" />
        </button>
      </div>
    </footer>

    <VersionNameDialog
      :open="createOpen"
      mode="create"
      :submitting="submitting"
      @close="createOpen = false"
      @submit="onCreateSubmit"
    />

    <VersionNameDialog
      :open="editingVersion !== null"
      mode="rename"
      :initial-name="editingVersion?.name ?? ''"
      :submitting="submitting"
      @close="editingVersion = null"
      @submit="onRenameSubmit"
    />

    <ConfirmDialog
      :open="deletingVersion !== null"
      title="Excluir versão"
      :description="`A versão “${deletingVersion?.name ?? ''}” será excluída da sua conta. O currículo-base e as demais versões não serão alterados.`"
      confirm-label="Excluir versão"
      @close="deletingVersion = null"
      @confirm="onDeleteConfirm"
    />

    <ConfirmDialog
      :open="confirmLogout"
      title="Sair sem salvar"
      description="Há alterações não salvas nos seus currículos. Se sair agora, elas serão perdidas."
      confirm-label="Sair sem salvar"
      @close="confirmLogout = false"
      @confirm="onLogout"
    />
  </aside>
</template>
