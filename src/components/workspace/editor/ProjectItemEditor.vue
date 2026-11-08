<script setup lang="ts">
import { computed } from 'vue'

import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import EditorItemCard from './EditorItemCard.vue'
import TagsInput from './TagsInput.vue'
import { useResumesStore } from '@/stores/resumes'

const props = defineProps<{ projectId: string }>()

const store = useResumesStore()

const project = computed(() =>
  store.selectedResume.projects.find((item) => item.id === props.projectId)!,
)

function onTechnologiesChange() {
  store.touch()
}
</script>

<template>
  <EditorItemCard
    :title="project.name || 'Novo projeto'"
    :subtitle="project.technologies.join(' · ') || 'Tecnologias não informadas'"
    :remove-label="`Remover projeto ${project.name || 'novo projeto'}`"
    @remove="store.removeProject(project.id)"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="project.name" label="Nome do projeto" placeholder="Nome" />
      <AppInput v-model="project.url" label="URL do projeto" placeholder="https://exemplo.com" />
      <AppInput
        v-model="project.repository"
        label="URL do repositório"
        placeholder="https://github.com/usuario/projeto"
      />
    </div>

    <div class="mt-4 space-y-4">
      <TagsInput
        v-model="project.technologies"
        label="Tecnologias"
        placeholder="Ex.: Vue 3, Go"
        @change="onTechnologiesChange"
      />

      <AppTextarea
        v-model="project.description"
        label="Descrição"
        :rows="3"
        placeholder="O que o projeto faz e qual foi o seu papel."
      />
    </div>
  </EditorItemCard>
</template>
