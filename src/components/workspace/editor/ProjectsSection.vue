<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Import, Plus } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import GithubImportDialog from '../GithubImportDialog.vue'
import SectionCard from './SectionCard.vue'
import ProjectItemEditor from './ProjectItemEditor.vue'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

const importOpen = ref(false)
</script>

<template>
  <SectionCard
    id="resume-section-projects"
    title="Projetos"
    description="Trabalhos que mostram como você resolve problemas."
    :badge="resume.projects.length"
  >
    <div class="space-y-4">
      <ProjectItemEditor v-for="item in resume.projects" :key="item.id" :project-id="item.id" />

      <p v-if="!resume.projects.length" class="text-sm text-text-secondary">
        Nenhum projeto adicionado.
      </p>

      <div class="flex flex-wrap gap-2">
        <AppButton variant="outline" size="sm" @click="store.addProject()">
          <Plus class="size-4" aria-hidden="true" />
          Adicionar projeto
        </AppButton>
        <AppButton variant="outline" size="sm" @click="importOpen = true">
          <Import class="size-4" aria-hidden="true" />
          Importar do GitHub
        </AppButton>
      </div>
    </div>

    <GithubImportDialog :open="importOpen" @close="importOpen = false" />
  </SectionCard>
</template>
