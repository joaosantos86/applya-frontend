<script setup lang="ts">
import { computed } from 'vue'

import { formatDateRange } from '@/lib/resume/format'
import { displayUrl } from '@/lib/resume/mapper'
import type { Resume } from '@/lib/resume/types'

const props = defineProps<{ resume: Resume }>()

const contactItems = computed(() => {
  const personal = props.resume.personal
  return [
    personal.email,
    personal.phone,
    personal.location,
    displayUrl(personal.linkedin),
    displayUrl(personal.github),
    displayUrl(personal.website),
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
    class="paper resume-sheet mx-auto aspect-[210/297] w-full max-w-[794px] bg-surface px-8 py-10 font-serif text-text-primary sm:px-14 sm:py-14"
    aria-label="Pré-visualização do currículo"
  >
    <header class="pb-5">
      <h1 class="text-[26px] leading-tight font-semibold tracking-tight sm:text-[30px]">
        {{ resume.personal.fullName || 'Seu nome' }}
      </h1>

      <p v-if="resume.personal.headline" class="mt-1 text-[14px] text-text-secondary">
        {{ resume.personal.headline }}
      </p>

      <ul
        v-if="contactItems.length"
        class="contact-list mt-3 flex flex-wrap gap-y-1 font-sans text-[11px] text-text-secondary"
      >
        <li v-for="item in contactItems" :key="item" class="break-words">
          {{ item }}
        </li>
      </ul>
    </header>

    <section v-if="hasSummary" class="resume-section">
      <h2 class="resume-heading">Resumo profissional</h2>
      <p class="text-[12.5px] leading-relaxed whitespace-pre-line">
        {{ resume.summary }}
      </p>
    </section>

    <section v-if="resume.experiences.length" class="resume-section">
      <h2 class="resume-heading">Experiência profissional</h2>

      <div class="space-y-4">
        <div v-for="experience in resume.experiences" :key="experience.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h3 class="text-[13.5px] font-semibold">
              {{ experience.role || 'Cargo' }}
            </h3>
            <p class="font-sans text-[11px] whitespace-nowrap text-text-muted tabular-nums">
              {{ formatDateRange(experience.startDate, experience.endDate, experience.current) }}
            </p>
          </div>

          <p class="text-[12.5px] text-text-secondary italic">
            {{ [experience.company, experience.location].filter(Boolean).join(' · ') }}
          </p>

          <ul
            v-if="descriptionLines(experience.description).length"
            class="mt-1.5 list-disc space-y-0.5 pl-4 text-[12.5px] leading-relaxed marker:text-text-muted"
          >
            <li v-for="(line, index) in descriptionLines(experience.description)" :key="index">
              {{ line }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="resume.education.length" class="resume-section">
      <h2 class="resume-heading">Formação acadêmica</h2>

      <div class="space-y-3">
        <div v-for="education in resume.education" :key="education.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h3 class="text-[13.5px] font-semibold">
              {{ education.course || 'Curso' }}
            </h3>
            <p
              v-if="education.startDate || education.endDate"
              class="font-sans text-[11px] whitespace-nowrap text-text-muted tabular-nums"
            >
              {{ formatDateRange(education.startDate, education.endDate, false) }}
            </p>
          </div>

          <p class="text-[12.5px] text-text-secondary italic">
            {{ [education.institution, education.degree].filter(Boolean).join(' · ') }}
          </p>

          <p v-if="education.description" class="mt-1 text-[12.5px] leading-relaxed">
            {{ education.description }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="resume.skills.length" class="resume-section">
      <h2 class="resume-heading">Habilidades</h2>

      <ul class="flex flex-wrap text-[12.5px] leading-relaxed">
        <li v-for="skill in resume.skills" :key="skill.id" class="skill-item">
          {{ skill.name }}
        </li>
      </ul>
    </section>

    <section v-if="resume.projects.length" class="resume-section">
      <h2 class="resume-heading">Projetos</h2>

      <div class="space-y-3">
        <div v-for="project in resume.projects" :key="project.id">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 class="text-[13.5px] font-semibold">{{ project.name || 'Projeto' }}</h3>
            <p class="flex flex-wrap gap-x-3 font-sans text-[11px] text-text-muted">
              <span v-if="project.url" class="break-all">{{ displayUrl(project.url) }}</span>
              <span v-if="project.repository" class="break-all">{{
                displayUrl(project.repository)
              }}</span>
            </p>
          </div>

          <p v-if="project.technologies.length" class="text-[12.5px] text-text-secondary italic">
            {{ project.technologies.join(' · ') }}
          </p>

          <p v-if="project.description" class="mt-1 text-[12.5px] leading-relaxed">
            {{ project.description }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="resume.languages.length" class="resume-section">
      <h2 class="resume-heading">Idiomas</h2>

      <ul class="grid gap-x-10 gap-y-1 text-[12.5px] sm:grid-cols-2">
        <li
          v-for="language in resume.languages"
          :key="language.id"
          class="flex items-baseline justify-between gap-4"
        >
          <span>{{ language.name || 'Idioma' }}</span>
          <span class="text-text-secondary italic">{{ language.proficiency }}</span>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
/* Folha de papel sobre a mesa: hairline neutra e sombra baixa e difusa.
 * A proporção A4 (210×297) é a altura mínima; conteúdo maior estende a folha. */
.resume-sheet {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-text-primary) 6%, transparent),
    0 1px 2px color-mix(in srgb, var(--color-text-primary) 5%, transparent),
    0 16px 40px -20px color-mix(in srgb, var(--color-text-primary) 20%, transparent);
}

.resume-section {
  margin-top: 1.25rem;
}

/* Convenção de documento: títulos de seção em versalete, com fio fino. */
.resume-heading {
  margin-bottom: 0.625rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text-primary) 18%, transparent);
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.contact-list li:not(:last-child)::after,
.skill-item:not(:last-child)::after {
  content: '·';
  margin-inline: 0.5em;
  color: var(--color-text-muted);
}
</style>
