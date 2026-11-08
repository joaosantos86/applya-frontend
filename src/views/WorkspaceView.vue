<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, Eye, Menu, PencilLine } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import ToastStack from '@/components/ui/ToastStack.vue'
import ResumeEditor from '@/components/workspace/ResumeEditor.vue'
import ResumePreview from '@/components/workspace/ResumePreview.vue'
import SaveStatus from '@/components/workspace/SaveStatus.vue'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar.vue'
import { formatUpdatedAt } from '@/lib/resume/format'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume, saveStatus, lastSavedAt } = storeToRefs(store)

const sidebarOpen = ref(false)
const mobilePreview = ref(false)

const isBase = computed(() => selectedResume.value.kind === 'base')

const resumeContext = computed(() =>
  isBase.value ? 'Fonte para novas versões' : 'Versão derivada do currículo-base',
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-background">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-text-primary/30 backdrop-blur-[1px] lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <WorkspaceSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <main class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface px-4 py-3 sm:px-6"
      >
        <button
          type="button"
          class="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          aria-label="Abrir menu"
          @click="sidebarOpen = true"
        >
          <Menu class="size-5" aria-hidden="true" />
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 class="truncate text-base font-semibold text-text-primary">
              {{ selectedResume.name }}
            </h1>

            <span
              class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
              :class="
                isBase
                  ? 'border-primary/70 bg-primary/20 text-text-primary'
                  : 'border-border bg-background text-text-secondary'
              "
            >
              {{ isBase ? 'Currículo-base' : 'Versão' }}
            </span>
          </div>

          <p class="mt-0.5 truncate text-xs text-text-secondary">
            {{ resumeContext }} · Atualizado {{ formatUpdatedAt(selectedResume.updatedAt) }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <SaveStatus :status="saveStatus" :last-saved-at="lastSavedAt" />

          <AppButton
            variant="outline"
            class="xl:hidden"
            :aria-pressed="mobilePreview"
            @click="mobilePreview = !mobilePreview"
          >
            <PencilLine v-if="mobilePreview" class="size-4" aria-hidden="true" />
            <Eye v-else class="size-4" aria-hidden="true" />
            {{ mobilePreview ? 'Editar' : 'Prévia' }}
          </AppButton>

          <span id="export-hint" class="sr-only">
            A exportação em PDF ainda não está disponível nesta versão do Applya.
          </span>

          <div class="flex items-center gap-2" title="Exportação em PDF disponível em breve">
            <AppButton variant="outline" disabled aria-describedby="export-hint">
              <Download class="size-4" aria-hidden="true" />
              <span class="hidden sm:inline">Exportar PDF</span>
              <span class="sr-only sm:hidden">Exportar PDF</span>
            </AppButton>
            <span class="hidden text-[11px] text-text-secondary md:inline">Em breve</span>
          </div>
        </div>
      </header>

      <div class="flex min-h-0 flex-1">
        <section
          class="min-h-0 flex-1 overflow-y-auto xl:border-r xl:border-border"
          :class="mobilePreview ? 'hidden xl:block' : 'block'"
          aria-label="Editor do currículo"
        >
          <ResumeEditor />
        </section>

        <aside
          class="min-h-0 flex-1 flex-col overflow-hidden bg-background xl:flex xl:w-[48%] xl:flex-none"
          :class="mobilePreview ? 'flex' : 'hidden xl:flex'"
          aria-label="Painel de pré-visualização"
        >
          <div
            class="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2.5 sm:px-6"
          >
            <div class="flex items-center gap-2">
              <Eye class="size-4 text-text-secondary" aria-hidden="true" />
              <p class="text-sm font-medium text-text-primary">Pré-visualização</p>
            </div>
            <span
              class="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-text-secondary"
            >
              A4 · Modelo único
            </span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
            <ResumePreview :resume="selectedResume" />

            <p class="mx-auto mt-3 max-w-[794px] text-center text-xs text-text-secondary">
              A prévia acompanha suas alterações em tempo real. A exportação em PDF estará
              disponível em uma próxima etapa.
            </p>
          </div>
        </aside>
      </div>
    </main>

    <ToastStack />
  </div>
</template>
