<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Sparkles } from '@lucide/vue'

import SectionCard from './SectionCard.vue'
import TagsInput from './TagsInput.vue'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)
</script>

<template>
  <SectionCard
    id="resume-section-skills"
    title="Habilidades"
    description="Tecnologias, ferramentas e competências que você domina."
    :icon="Sparkles"
    :badge="resume.skills.length"
  >
    <TagsInput
      v-model="resume.skills"
      label="Habilidades"
      placeholder="Ex.: TypeScript, Go, Docker"
      hint="Use nomes curtos. Pressione Enter para adicionar."
      add-label="Adicionar"
      @change="store.touch()"
    />
  </SectionCard>
</template>
