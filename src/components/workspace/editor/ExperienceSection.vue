<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Plus } from '@lucide/vue'

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
    id="resume-section-experience"
    title="Experiências profissionais"
    description="Da mais recente para a mais antiga."
    :badge="resume.experiences.length"
  >
    <div class="space-y-4">
      <EditorItemCard
        v-for="experience in resume.experiences"
        :key="experience.id"
        :title="experience.company || 'Nova experiência'"
        :subtitle="experience.role || 'Cargo não informado'"
        :remove-label="`Remover experiência em ${experience.company || 'nova experiência'}`"
        @remove="store.removeExperience(experience.id)"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput v-model="experience.company" label="Empresa" placeholder="Nome da empresa" />
          <AppInput v-model="experience.role" label="Cargo" placeholder="Seu cargo" />
          <div class="sm:col-span-2">
            <AppInput
              v-model="experience.location"
              label="Localização"
              placeholder="São Paulo, SP ou Remoto"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 sm:col-span-2">
            <AppInput v-model="experience.startDate" label="Início" type="month" />
            <AppInput
              v-model="experience.endDate"
              label="Término"
              type="month"
              :disabled="experience.current"
            />
          </div>

          <label class="flex items-center gap-2 text-sm text-text-primary sm:col-span-2">
            <input
              v-model="experience.current"
              type="checkbox"
              class="size-4 rounded border-border accent-primary"
            />
            Trabalho atual
          </label>
        </div>

        <div class="mt-4">
          <AppTextarea
            v-model="experience.description"
            label="Descrição"
            :rows="4"
            placeholder="Uma conquista por linha."
            hint="Cada linha vira um item na pré-visualização."
          />
        </div>
      </EditorItemCard>

      <p v-if="!resume.experiences.length" class="text-sm text-text-secondary">
        Nenhuma experiência adicionada. Comece pela mais recente.
      </p>

      <AppButton variant="outline" size="sm" @click="store.addExperience()">
        <Plus class="size-4" aria-hidden="true" />
        Adicionar experiência
      </AppButton>
    </div>
  </SectionCard>
</template>
