<script setup lang="ts">
/**
 * Editor do currículo em etapas: uma seção por vez, com navegação numerada
 * no topo e "Anterior"/"Próximo" no rodapé. A etapa atual é mantida ao trocar
 * de currículo (o componente não é recriado).
 */
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { Check, ChevronLeft, ChevronRight } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import EducationSection from './editor/EducationSection.vue'
import ExperienceSection from './editor/ExperienceSection.vue'
import LanguagesSection from './editor/LanguagesSection.vue'
import PersonalSection from './editor/PersonalSection.vue'
import ProjectsSection from './editor/ProjectsSection.vue'
import SkillsSection from './editor/SkillsSection.vue'
import SummarySection from './editor/SummarySection.vue'
import { useResumesStore } from '@/stores/resumes'

interface EditorStep {
  id: string
  label: string
  component: Component
}

const steps: EditorStep[] = [
  { id: 'personal', label: 'Dados pessoais', component: PersonalSection },
  { id: 'summary', label: 'Resumo', component: SummarySection },
  { id: 'experience', label: 'Experiências', component: ExperienceSection },
  { id: 'education', label: 'Formação', component: EducationSection },
  { id: 'skills', label: 'Habilidades', component: SkillsSection },
  { id: 'projects', label: 'Projetos', component: ProjectsSection },
  { id: 'languages', label: 'Idiomas', component: LanguagesSection },
]

const store = useResumesStore()
const root = ref<HTMLElement | null>(null)

/** Etapas com conteúdo, marcadas com ✓ na navegação (indicador de progresso). */
const filled = computed<Record<string, boolean>>(() => {
  const resume = store.selectedResume
  const personal = resume.personal
  return {
    personal: [personal.fullName, personal.headline, personal.email].some((v) => v.trim()),
    summary: resume.summary.trim().length > 0,
    experience: resume.experiences.length > 0,
    education: resume.education.length > 0,
    skills: resume.skills.length > 0,
    projects: resume.projects.length > 0,
    languages: resume.languages.length > 0,
  }
})
const currentIndex = ref(0)

const current = computed(() => steps[currentIndex.value] ?? steps[0]!)
const previous = computed(() => steps[currentIndex.value - 1])
const next = computed(() => steps[currentIndex.value + 1])

function goTo(index: number): void {
  if (index < 0 || index >= steps.length || index === currentIndex.value) return
  currentIndex.value = index
  // Volta ao topo do painel do editor ao trocar de etapa.
  root.value?.scrollIntoView?.({ block: 'start' })
}
</script>

<template>
  <div ref="root" @input="store.touch()" @change="store.touch()">
    <!-- Com pouco espaço (container < 50rem), as etapas inativas mostram só o
         número; o nome continua no tooltip e para leitores de tela. -->
    <nav
      class="@container sticky top-0 z-10 border-b border-border bg-surface/95 px-4 backdrop-blur-sm sm:px-8"
      aria-label="Etapas do currículo"
    >
      <ol class="mx-auto flex w-fit max-w-full gap-4 overflow-x-auto [scrollbar-width:none]">
        <li v-for="(step, index) in steps" :key="step.id" class="shrink-0">
          <button
            type="button"
            class="-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-sm transition-colors duration-150 focus-visible:outline-offset-0 motion-reduce:transition-none"
            :class="
              index === currentIndex
                ? 'border-text-primary font-medium text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            "
            :aria-current="index === currentIndex ? 'step' : undefined"
            :title="step.label"
            @click="goTo(index)"
          >
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums"
              :class="
                index === currentIndex
                  ? 'bg-primary text-on-primary'
                  : filled[step.id]
                    ? 'bg-subtle text-text-primary'
                    : 'border border-border-strong text-text-muted'
              "
              aria-hidden="true"
            >
              <Check v-if="index !== currentIndex && filled[step.id]" class="size-3" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span :class="index === currentIndex ? '' : 'sr-only @min-[50rem]:not-sr-only'">
              {{ step.label }}
            </span>
            <span v-if="filled[step.id]" class="sr-only">(preenchida)</span>
          </button>
        </li>
      </ol>
    </nav>

    <div class="mx-auto max-w-2xl px-4 pb-10 sm:px-8">
      <component :is="current.component" />

      <footer class="flex items-center justify-between gap-3 border-t border-border pt-6">
        <AppButton v-if="previous" variant="ghost" size="sm" @click="goTo(currentIndex - 1)">
          <ChevronLeft class="size-4" aria-hidden="true" />
          {{ previous.label }}
        </AppButton>
        <span v-else />

        <p class="text-xs text-text-muted tabular-nums">
          Etapa {{ currentIndex + 1 }} de {{ steps.length }}
        </p>

        <AppButton v-if="next" variant="outline" size="sm" @click="goTo(currentIndex + 1)">
          {{ next.label }}
          <ChevronRight class="size-4" aria-hidden="true" />
        </AppButton>
        <span v-else />
      </footer>
    </div>
  </div>
</template>
