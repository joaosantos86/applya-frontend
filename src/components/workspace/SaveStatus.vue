<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleDot, LoaderCircle, TriangleAlert } from '@lucide/vue'

import type { SaveStatus } from '@/stores/resumes'

const props = defineProps<{
  status: SaveStatus
  lastSavedAt: string | null
}>()

const LABELS: Record<SaveStatus, string> = {
  clean: 'Sem alterações',
  saved: 'Currículo salvo',
  dirty: 'Alterações não salvas',
  saving: 'Salvando…',
  error: 'Falha ao salvar',
  conflict: 'Conflito de edição',
}

const label = computed(() => LABELS[props.status])

const title = computed(() => {
  if (props.status !== 'saved' || !props.lastSavedAt) return label.value
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(props.lastSavedAt),
  )
  return `Salvo no servidor às ${time}`
})
</script>

<template>
  <p
    class="inline-flex items-center gap-1.5 text-xs text-text-secondary"
    :title="title"
    role="status"
    aria-live="polite"
  >
    <LoaderCircle
      v-if="status === 'saving'"
      class="size-3.5 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
    <TriangleAlert
      v-else-if="status === 'error' || status === 'conflict'"
      class="size-3.5 text-error"
      aria-hidden="true"
    />
    <CircleDot v-else-if="status === 'dirty'" class="size-3.5 text-text-muted" aria-hidden="true" />
    <CircleCheck
      v-else
      class="size-3.5"
      :class="status === 'saved' ? 'text-success' : 'text-text-muted'"
      aria-hidden="true"
    />
    {{ label }}
  </p>
</template>
