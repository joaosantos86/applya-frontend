<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { FolderGit2, Plus } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import SectionCard from './SectionCard.vue'
import ProjectItemEditor from './ProjectItemEditor.vue'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)
</script>

<template>
  <SectionCard
    id="resume-section-projects"
    title="Projetos"
    description="Trabalhos que mostram como você resolve problemas."
    :icon="FolderGit2"
    :badge="resume.projects.length"
  >
    <div class="space-y-4">
      <ProjectItemEditor v-for="item in resume.projects" :key="item.id" :project-id="item.id" />

      <p v-if="!resume.projects.length" class="text-sm text-text-secondary">
        Nenhum projeto adicionado.
      </p>

      <AppButton variant="outline" @click="store.addProject()">
        <Plus class="size-4" aria-hidden="true" />
        Adicionar projeto
      </AppButton>
    </div>
  </SectionCard>
</template>
