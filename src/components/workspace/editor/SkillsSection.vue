<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import SectionCard from './SectionCard.vue'
import TagsInput from './TagsInput.vue'
import { createId } from '@/lib/resume/id'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

/**
 * O campo de tags trabalha com nomes; o currículo guarda `{id, name}`.
 * Nomes que já existiam mantêm o id (o servidor preserva o item).
 */
const skillNames = computed<string[]>({
  get: () => resume.value.skills.map((skill) => skill.name),
  set: (names) => {
    const current = resume.value.skills
    resume.value.skills = names.map(
      (name) => current.find((skill) => skill.name === name) ?? { id: createId('skill'), name },
    )
  },
})
</script>

<template>
  <SectionCard
    id="resume-section-skills"
    title="Habilidades"
    description="Tecnologias, ferramentas e competências que você domina."
    :badge="resume.skills.length"
  >
    <TagsInput
      v-model="skillNames"
      label="Habilidades"
      placeholder="Ex.: TypeScript, Go, Docker"
      hint="Use nomes curtos. Pressione Enter para adicionar."
      add-label="Adicionar"
      @change="store.touch()"
    />
  </SectionCard>
</template>
