<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { GraduationCap, Plus } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import EditorItemCard from './EditorItemCard.vue'
import SectionCard from './SectionCard.vue'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)
</script>

<template>
  <SectionCard
    id="resume-section-education"
    title="Formação acadêmica"
    description="Cursos, graduações e formações técnicas."
    :icon="GraduationCap"
    :badge="resume.education.length"
  >
    <div class="space-y-4">
      <EditorItemCard
        v-for="education in resume.education"
        :key="education.id"
        :title="education.institution || 'Nova formação'"
        :subtitle="education.course || 'Curso não informado'"
        :remove-label="`Remover formação em ${education.institution || 'nova formação'}`"
        @remove="store.removeEducation(education.id)"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="education.institution"
            label="Instituição"
            placeholder="Nome da instituição"
          />
          <AppInput
            v-model="education.course"
            label="Curso"
            placeholder="Ex.: Sistemas de Informação"
          />
          <AppInput
            v-model="education.degree"
            label="Grau acadêmico"
            placeholder="Ex.: Bacharelado, Técnico"
          />
          <AppInput v-model="education.period" label="Período" placeholder="2015 — 2019" />
        </div>

        <div class="mt-4">
          <AppTextarea
            v-model="education.description"
            label="Descrição (opcional)"
            :rows="3"
            placeholder="Destaques, trabalho de conclusão, monitoria…"
          />
        </div>
      </EditorItemCard>

      <p v-if="!resume.education.length" class="text-sm text-text-secondary">
        Nenhuma formação adicionada.
      </p>

      <AppButton variant="outline" @click="store.addEducation()">
        <Plus class="size-4" aria-hidden="true" />
        Adicionar formação
      </AppButton>
    </div>
  </SectionCard>
</template>
