<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Languages, Plus, Trash2 } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import SectionCard from './SectionCard.vue'
import { useResumesStore } from '@/stores/resumes'
import { LANGUAGE_PROFICIENCIES } from '@/lib/resume/types'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

const proficiencyOptions = computed(() =>
  LANGUAGE_PROFICIENCIES.map((proficiency) => ({ value: proficiency, label: proficiency })),
)
</script>

<template>
  <SectionCard
    id="resume-section-languages"
    title="Idiomas"
    description="Idiomas que você fala e seu nível de proficiência."
    :icon="Languages"
    :badge="resume.languages.length"
  >
    <div class="space-y-3">
      <div
        v-for="language in resume.languages"
        :key="language.id"
        class="grid items-end gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <AppInput v-model="language.name" label="Idioma" placeholder="Ex.: Inglês" />
        <AppSelect
          v-model="language.proficiency"
          label="Nível de proficiência"
          :options="proficiencyOptions"
        />

        <button
          type="button"
          class="mb-0.5 inline-flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="`Remover idioma ${language.name || 'não informado'}`"
          @click="store.removeLanguage(language.id)"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </button>
      </div>

      <p v-if="!resume.languages.length" class="text-sm text-text-secondary">
        Nenhum idioma adicionado.
      </p>

      <AppButton variant="outline" @click="store.addLanguage()">
        <Plus class="size-4" aria-hidden="true" />
        Adicionar idioma
      </AppButton>
    </div>
  </SectionCard>
</template>
