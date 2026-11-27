<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronRight, Download, Eye, Menu, PencilLine, RefreshCcw } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import ToastStack from '@/components/ui/ToastStack.vue'
import ConfirmDialog from '@/components/workspace/ConfirmDialog.vue'
import ResumeEditor from '@/components/workspace/ResumeEditor.vue'
import ResumePreview from '@/components/workspace/ResumePreview.vue'
import SaveStatus from '@/components/workspace/SaveStatus.vue'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar.vue'
import { useToast } from '@/composables/useToast'
import { saveBlob, slugify } from '@/lib/download'
import { formatUpdatedAt } from '@/lib/resume/format'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume, saveStatus, saveError, lastSavedAt, loadStatus, loadError } =
  storeToRefs(store)
const { notify } = useToast()

const sidebarOpen = ref(false)
const mobilePreview = ref(false)
const confirmReload = ref(false)
const exporting = ref(false)

const isBase = computed(() => selectedResume.value.kind === 'base')
const canSave = computed(() => saveStatus.value === 'dirty' || saveStatus.value === 'error')

async function save(): Promise<void> {
  if (!canSave.value) return
  await store.save()
  // O resultado aparece no indicador de status e no aviso abaixo do topo.
}

/** Baixa o PDF do currículo como está no editor (inclui alterações não salvas). */
async function exportPdf(): Promise<void> {
  if (exporting.value) return
  exporting.value = true
  const result = await store.exportPdf()
  exporting.value = false

  if (!result.ok) {
    notify(result.error, 'error')
    return
  }
  const resume = selectedResume.value
  const name = slugify(
    [resume.personal.fullName, resume.kind === 'version' ? resume.name : '']
      .filter(Boolean)
      .join(' '),
  )
  saveBlob(result.value, `curriculo${name ? `-${name}` : ''}.pdf`)
}

async function reload(): Promise<void> {
  confirmReload.value = false
  const result = await store.reloadSelected()
  if (result.ok) notify('Currículo recarregado com a versão mais recente.', 'info')
  else notify(result.error, 'error')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
    return
  }
  // Ctrl+S / Cmd+S salva o currículo aberto.
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void save()
  }
}

/** Avisa antes de fechar/recarregar a aba com alterações não salvas. */
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!store.hasUnsavedChanges) return
  event.preventDefault()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  void store.load()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div
    v-if="loadStatus !== 'ready'"
    class="flex h-dvh items-center justify-center bg-background px-6"
  >
    <div v-if="loadStatus === 'error'" class="w-full max-w-sm space-y-3">
      <FormAlert
        variant="error"
        :message="loadError ?? 'Não foi possível carregar seus currículos.'"
      />
      <AppButton variant="outline" @click="store.load()">
        <RefreshCcw class="size-4" aria-hidden="true" />
        Tentar novamente
      </AppButton>
    </div>
    <p v-else role="status" class="text-sm text-text-secondary">Carregando seus currículos…</p>
  </div>

  <div v-else class="flex h-dvh overflow-hidden bg-background">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-overlay/50 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <WorkspaceSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <main class="flex min-w-0 flex-1 flex-col bg-surface">
      <header class="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
        <button
          type="button"
          class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
          aria-label="Abrir menu"
          @click="sidebarOpen = true"
        >
          <Menu class="size-5" aria-hidden="true" />
        </button>

        <div class="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <template v-if="!isBase">
            <span class="hidden text-text-muted sm:inline">Versões</span>
            <ChevronRight
              class="hidden size-3.5 shrink-0 text-text-muted sm:block"
              aria-hidden="true"
            />
          </template>
          <h1 class="truncate font-medium text-text-primary">{{ selectedResume.name }}</h1>
          <span class="hidden shrink-0 text-xs text-text-muted md:inline">
            · Atualizado {{ formatUpdatedAt(selectedResume.updatedAt) }}
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <div class="hidden sm:block">
            <SaveStatus :status="saveStatus" :last-saved-at="lastSavedAt" />
          </div>

          <AppButton
            size="sm"
            :variant="canSave || saveStatus === 'saving' ? 'primary' : 'outline'"
            :disabled="!canSave"
            :loading="saveStatus === 'saving'"
            title="Salvar (Ctrl+S)"
            @click="save"
          >
            {{ saveStatus === 'saving' ? 'Salvando…' : 'Salvar' }}
          </AppButton>

          <AppButton
            size="sm"
            variant="outline"
            class="xl:hidden"
            @click="mobilePreview = !mobilePreview"
          >
            <PencilLine v-if="mobilePreview" class="size-4" aria-hidden="true" />
            <Eye v-else class="size-4" aria-hidden="true" />
            {{ mobilePreview ? 'Editar' : 'Prévia' }}
          </AppButton>

          <AppButton
            size="sm"
            variant="outline"
            :loading="exporting"
            title="Baixar o currículo em PDF, como está no editor"
            @click="exportPdf"
          >
            <Download v-if="!exporting" class="size-4" aria-hidden="true" />
            <span class="hidden lg:inline">Exportar PDF</span>
            <span class="sr-only lg:hidden">Exportar PDF</span>
          </AppButton>
        </div>
      </header>

      <!-- Falha no salvamento ou conflito de revisão (409) -->
      <div
        v-if="(saveStatus === 'error' || saveStatus === 'conflict') && saveError"
        class="flex flex-wrap items-center gap-3 border-b border-border bg-error/5 px-4 py-2.5 sm:px-6"
      >
        <p role="alert" class="min-w-0 flex-1 text-sm text-error">{{ saveError }}</p>
        <AppButton
          v-if="saveStatus === 'conflict'"
          size="sm"
          variant="outline"
          @click="confirmReload = true"
        >
          <RefreshCcw class="size-4" aria-hidden="true" />
          Recarregar
        </AppButton>
      </div>

      <div class="flex min-h-0 flex-1">
        <section
          class="min-h-0 flex-1 overflow-y-auto"
          :class="mobilePreview ? 'hidden xl:block' : 'block'"
          aria-label="Editor do currículo"
        >
          <ResumeEditor />
        </section>

        <aside
          class="min-h-0 flex-1 flex-col overflow-hidden border-border bg-subtle xl:flex xl:w-[46%] xl:flex-none xl:border-l"
          :class="mobilePreview ? 'flex' : 'hidden xl:flex'"
          aria-label="Painel de pré-visualização"
        >
          <div class="flex h-10 shrink-0 items-center justify-between gap-2 px-4 sm:px-6">
            <p class="text-xs font-medium text-text-secondary">Pré-visualização</p>
            <span class="text-xs text-text-muted">A4</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-8">
            <ResumePreview :resume="selectedResume" />
          </div>
        </aside>
      </div>
    </main>

    <ConfirmDialog
      :open="confirmReload"
      title="Recarregar currículo"
      description="As alterações não salvas deste currículo serão descartadas e substituídas pela versão mais recente do servidor."
      confirm-label="Descartar e recarregar"
      @close="confirmReload = false"
      @confirm="reload"
    />

    <ToastStack />
  </div>
</template>
