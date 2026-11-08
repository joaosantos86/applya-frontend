<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import {
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages,
  Sparkles,
  User,
} from '@lucide/vue'

import EducationSection from './editor/EducationSection.vue'
import ExperienceSection from './editor/ExperienceSection.vue'
import LanguagesSection from './editor/LanguagesSection.vue'
import PersonalSection from './editor/PersonalSection.vue'
import ProjectsSection from './editor/ProjectsSection.vue'
import SkillsSection from './editor/SkillsSection.vue'
import SummarySection from './editor/SummarySection.vue'
import { useResumesStore } from '@/stores/resumes'

interface EditorSectionLink {
  id: string
  label: string
  icon: Component
}

const sections: EditorSectionLink[] = [
  { id: 'personal', label: 'Dados pessoais', icon: User },
  { id: 'summary', label: 'Resumo', icon: FileText },
  { id: 'experience', label: 'Experiências', icon: Briefcase },
  { id: 'education', label: 'Formação', icon: GraduationCap },
  { id: 'skills', label: 'Habilidades', icon: Sparkles },
  { id: 'projects', label: 'Projetos', icon: FolderGit2 },
  { id: 'languages', label: 'Idiomas', icon: Languages },
]

const store = useResumesStore()
const activeSection = ref('personal')

function revealSection(id: string) {
  activeSection.value = id

  const element = document.getElementById(`resume-section-${id}`)
  if (!element) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <div @input="store.touch()" @change="store.touch()">
    <nav
      class="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6"
      aria-label="Seções do currículo"
    >
      <div class="mx-auto flex max-w-3xl gap-1 overflow-x-auto pb-0.5">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none"
          :class="
            activeSection === section.id
              ? 'bg-primary/30 text-text-primary'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          "
          :aria-current="activeSection === section.id ? 'true' : undefined"
          @click="revealSection(section.id)"
        >
          <component :is="section.icon" class="size-3.5" aria-hidden="true" />
          {{ section.label }}
        </button>
      </div>
    </nav>

    <div class="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
      <PersonalSection />
      <SummarySection />
      <ExperienceSection />
      <EducationSection />
      <SkillsSection />
      <ProjectsSection />
      <LanguagesSection />
    </div>
  </div>
</template>
