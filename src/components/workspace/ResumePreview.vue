<script setup lang="ts">
import { computed } from 'vue'

import { formatDateRange } from '@/lib/resume/format'
import type { Resume } from '@/lib/resume/types'

const props = defineProps<{ resume: Resume }>()

const contactItems = computed(() => {
  const personal = props.resume.personal
  return [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.website,
  ].filter((item) => item.trim().length > 0)
})

const hasSummary = computed(() => props.resume.summary.trim().length > 0)

function descriptionLines(description: string): string[] {
  return description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
</script>

<template>
  <article
    class="mx-auto w-full max-w-[794px] bg-white px-8 py-9 text-text-primary shadow-sm ring-1 ring-border/70 sm:px-12 sm:py-12"
    aria-label="Pré-visualização do currículo"
    style="min-height: 1000px"
  >
    <header class="border-b-2 border-text-primary/80 pb-5">
      <h1 class="text-2xl font-bold tracking-tight sm:text-[28px]">
        {{ resume.personal.fullName || 'Seu nome' }}
      </h1>

      <p v-if="resume.personal.headline" class="mt-1 text-sm font-medium text-text-secondary">
        {{ resume.personal.headline }}
      </p>

      <ul
        v-if="contactItems.length"
        class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary"
      >
        <li v-for="item in contactItems" :key="item" class="break-words">
          {{ item }}
        </li>
      </ul>
    </header>

    <section v-if="hasSummary" class="mt-5">
      <h2 class="mb-2 text-[11px] font-semibold tracking-[0.16em] text-text-primary uppercase">
        Resumo profissional
      </h2>
      <p class="text-[13px] leading-relaxed whitespace-pre-line text-text-primary/90">
        {{ resume.summary }}
      </p>
    </section>

    <section v-if="resume.experiences.length" class="mt-5">
      <h2
        class="mb-3 border-b border-border pb-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        Experiências profissionais
      </h2>

      <div class="space-y-4">
        <div v-for="experience in resume.experiences" :key="experience.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h3 class="text-[13px] font-semibold">
              {{ experience.role || 'Cargo' }}
            </h3>
            <p class="text-[11px] whitespace-nowrap text-text-secondary">
              {{ formatDateRange(experience.startDate, experience.endDate, experience.current) }}
            </p>
          </div>

          <p class="text-[12px] text-text-secondary">
            {{ [experience.company, experience.location].filter(Boolean).join(' · ') }}
          </p>

          <ul
            v-if="descriptionLines(experience.description).length"
            class="mt-1.5 list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-text-primary/90"
          >
            <li v-for="(line, index) in descriptionLines(experience.description)" :key="index">
              {{ line }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="resume.education.length" class="mt-5">
      <h2
        class="mb-3 border-b border-border pb-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        Formação acadêmica
      </h2>

      <div class="space-y-3">
        <div v-for="education in resume.education" :key="education.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h3 class="text-[13px] font-semibold">
              {{ education.course || 'Curso' }}
            </h3>
            <p v-if="education.period" class="text-[11px] whitespace-nowrap text-text-secondary">
              {{ education.period }}
            </p>
          </div>

          <p class="text-[12px] text-text-secondary">
            {{ [education.institution, education.degree].filter(Boolean).join(' · ') }}
          </p>

          <p
            v-if="education.description"
            class="mt-1 text-[12px] leading-relaxed text-text-primary/90"
          >
            {{ education.description }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="resume.skills.length" class="mt-5">
      <h2
        class="mb-2.5 border-b border-border pb-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        Habilidades
      </h2>

      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="skill in resume.skills"
          :key="skill"
          class="rounded-md border border-border bg-background/70 px-2 py-0.5 text-[11px] text-text-primary/90"
        >
          {{ skill }}
        </li>
      </ul>
    </section>

    <section v-if="resume.projects.length" class="mt-5">
      <h2
        class="mb-3 border-b border-border pb-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        Projetos
      </h2>

      <div class="space-y-3">
        <div v-for="project in resume.projects" :key="project.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 class="text-[13px] font-semibold">{{ project.name || 'Projeto' }}</h3>
            <p class="flex flex-wrap gap-x-3 text-[10px] text-text-secondary">
              <span v-if="project.url" class="break-all">{{ project.url }}</span>
              <span v-if="project.repository" class="break-all">{{ project.repository }}</span>
            </p>
          </div>

          <p v-if="project.technologies.length" class="text-[11px] text-text-secondary">
            {{ project.technologies.join(' · ') }}
          </p>

          <p
            v-if="project.description"
            class="mt-1 text-[12px] leading-relaxed text-text-primary/90"
          >
            {{ project.description }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="resume.languages.length" class="mt-5">
      <h2
        class="mb-2.5 border-b border-border pb-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        Idiomas
      </h2>

      <ul class="grid gap-x-8 gap-y-1 text-[12px] sm:grid-cols-2">
        <li
          v-for="language in resume.languages"
          :key="language.id"
          class="flex items-baseline justify-between gap-4"
        >
          <span class="text-text-primary/90">{{ language.name || 'Idioma' }}</span>
          <span class="text-text-secondary">{{ language.proficiency }}</span>
        </li>
      </ul>
    </section>
  </article>
</template>
