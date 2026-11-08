<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { FileText } from '@lucide/vue'

import AppTextarea from '@/components/ui/AppTextarea.vue'
import SectionCard from './SectionCard.vue'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

const characters = computed(() => resume.value.summary.length)
</script>

<template>
  <SectionCard
    id="resume-section-summary"
    title="Resumo profissional"
    description="Dois ou três parágrafos curtos sobre sua trajetória."
    :icon="FileText"
  >
    <AppTextarea
      v-model="resume.summary"
      label="Resumo"
      :rows="6"
      placeholder="Conte quem você é, o que faz bem e o tipo de problema que gosta de resolver."
      hint="Prefira frases concretas e evite clichês. Este texto aparece no topo da prévia."
    />

    <p class="mt-2 text-right text-xs text-text-secondary" aria-hidden="true">
      {{ characters }} caracteres
    </p>
  </SectionCard>
</template>
