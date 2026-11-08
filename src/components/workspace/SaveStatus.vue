<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, LoaderCircle, TriangleAlert } from '@lucide/vue'

import type { SaveStatus } from '@/stores/resumes'

const props = defineProps<{
  status: SaveStatus
  lastSavedAt: string | null
}>()

const label = computed(() => {
  if (props.status === 'saving') return 'Salvando…'
  if (props.status === 'error') return 'Falha ao salvar'
  return 'Salvo localmente'
})

const title = computed(() => {
  if (props.status === 'saving') return 'Salvando alterações neste navegador'
  if (props.status === 'error') return 'Não foi possível salvar no armazenamento local'
  if (!props.lastSavedAt) return 'Alterações salvas neste navegador'

  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.lastSavedAt))

  return `Salvo neste navegador às ${time}`
})
</script>

<template>
  <p
    class="inline-flex items-center gap-1.5 text-xs text-text-secondary"
    :title="title"
    aria-live="polite"
  >
    <LoaderCircle
      v-if="status === 'saving'"
      class="size-3.5 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
    <TriangleAlert v-else-if="status === 'error'" class="size-3.5 text-error" aria-hidden="true" />
    <CircleCheck v-else class="size-3.5 text-success" aria-hidden="true" />
    {{ label }}
  </p>
</template>
