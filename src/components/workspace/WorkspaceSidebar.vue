<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Layers, LogOut, Pencil, Plus, Settings, Trash2, X } from '@lucide/vue'

import { getInitials, formatUpdatedAt } from '@/lib/resume/format'
import type { Resume } from '@/lib/resume/types'
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

const createOpen = ref(false)
const editingVersion = ref<Resume | null>(null)
const deletingVersion = ref<Resume | null>(null)

function selectResume(id: string) {
  store.selectResume(id)
  if (props.open) emit('close')
}

function onCreateSubmit(name: string) {
  const version = store.createVersion(name)
  createOpen.value = false

  if (version) {
    notify(`Versão “${version.name}” criada a partir do currículo-base.`)
  }
}

function onRenameSubmit(name: string) {
  const target = editingVersion.value
  if (!target) return

  const renamed = store.renameVersion(target.id, name)
  editingVersion.value = null

  if (renamed) notify(`Versão renomeada para “${name}”.`)
}

function onDeleteConfirm() {
  const target = deletingVersion.value
  if (!target) return

  const deleted = store.deleteVersion(target.id)
  deletingVersion.value = null

  if (deleted) notify(`Versão “${target.name}” excluída.`, 'info')
}

function openSettings() {
  notify('Configurações estarão disponíveis em breve.', 'info')
}

async function onLogout() {
  if (auth.loading) return
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0"
    :class="open ? 'translate-x-0' : 'invisible -translate-x-full lg:visible'"
    aria-label="Barra lateral do workspace"
  >
    <header class="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
      <div class="flex items-center gap-2.5">
        <span class="flex size-9 items-center justify-center rounded-xl bg-primary">
          <FileText class="size-5 text-text-primary" aria-hidden="true" />
        </span>
        <div>
          <p class="text-base leading-tight font-semibold text-text-primary">Applya</p>
          <p class="text-[11px] text-text-secondary">Currículos sob medida</p>
        </div>
      </div>

      <button
        type="button"
        class="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
        aria-label="Fechar menu"
        @click="emit('close')"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto px-3 py-4">
      <p class="mb-2 px-2 text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
        Currículos
      </p>

      <button
        type="button"
        class="mb-5 w-full rounded-xl border p-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        :class="
          store.isBaseSelected
            ? 'border-primary/70 bg-primary/15'
            : 'border-border hover:bg-background'
        "
        :aria-current="store.isBaseSelected ? 'true' : undefined"
        @click="selectResume(store.base.id)"
      >
        <span class="flex items-center gap-2.5">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface">
            <FileText class="size-4 text-text-primary" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-text-primary">
              {{ store.base.name }}
            </span>
            <span class="block truncate text-xs text-text-secondary">
              Base para novas versões
            </span>
          </span>
        </span>
      </button>

      <div class="mb-2 flex items-center justify-between px-2">
        <p class="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
          Minhas versões
        </p>
        <span class="text-xs text-text-secondary" aria-label="Total de versões">
          {{ store.versionCount }}
        </span>
      </div>

      <ul v-if="store.versions.length" class="space-y-1.5">
        <li v-for="version in store.versions" :key="version.id">
          <div
            class="relative rounded-xl border transition-colors duration-150 motion-reduce:transition-none"
            :class="
              store.selectedId === version.id
                ? 'border-primary/70 bg-primary/15'
                : 'border-transparent hover:bg-background'
            "
          >
            <button
              type="button"
              class="w-full rounded-xl p-2.5 pr-16 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :aria-current="store.selectedId === version.id ? 'true' : undefined"
              @click="selectResume(version.id)"
            >
              <span class="mb-0.5 flex items-center gap-1.5">
                <Layers class="size-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
                <span class="truncate text-sm font-medium text-text-primary">
                  {{ version.name }}
                </span>
              </span>
              <span class="block truncate text-xs text-text-secondary">
                Atualizado {{ formatUpdatedAt(version.updatedAt) }}
              </span>
            </button>

            <div class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
              <button
                type="button"
                class="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="`Renomear versão ${version.name}`"
                @click="editingVersion = version"
              >
                <Pencil class="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="`Excluir versão ${version.name}`"
                @click="deletingVersion = version"
              >
                <Trash2 class="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div
        v-else
        class="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-text-secondary"
      >
        Nenhuma versão ainda. Crie a primeira a partir do currículo-base.
      </div>

      <button
        type="button"
        class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-text-primary transition-colors duration-150 hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        @click="createOpen = true"
      >
        <Plus class="size-4" aria-hidden="true" />
        Nova versão
      </button>
    </div>

    <footer class="space-y-2 border-t border-border p-3">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="openSettings"
      >
        <Settings class="size-4" aria-hidden="true" />
        <span class="flex-1 text-left">Configurações</span>
        <span class="rounded-full border border-border px-1.5 py-0.5 text-[10px]">Em breve</span>
      </button>

      <div class="flex items-center gap-2.5 rounded-xl border border-border bg-background/60 p-2.5">
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-text-primary"
          aria-hidden="true"
        >
          {{ initials }}
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-text-primary">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-text-secondary">{{ auth.user?.email }}</p>
        </div>

        <button
          type="button"
          class="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
          aria-label="Sair da conta"
          title="Sair da conta"
          @click="onLogout"
        >
          <LogOut class="size-4" aria-hidden="true" />
        </button>
      </div>
    </footer>

    <VersionNameDialog
      :open="createOpen"
      mode="create"
      @close="createOpen = false"
      @submit="onCreateSubmit"
    />

    <VersionNameDialog
      :open="editingVersion !== null"
      mode="rename"
      :initial-name="editingVersion?.name ?? ''"
      @close="editingVersion = null"
      @submit="onRenameSubmit"
    />

    <ConfirmDialog
      :open="deletingVersion !== null"
      title="Excluir versão"
      :description="`A versão “${deletingVersion?.name ?? ''}” será removida deste navegador. O currículo-base e as demais versões não serão alterados.`"
      confirm-label="Excluir versão"
      @close="deletingVersion = null"
      @confirm="onDeleteConfirm"
    />
  </aside>
</template>
