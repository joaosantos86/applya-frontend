<script setup lang="ts">
import { Trash2 } from '@lucide/vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    removeLabel: string
  }>(),
  {
    subtitle: undefined,
  },
)

const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <article class="overflow-hidden rounded-lg border border-border bg-surface">
    <header
      class="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-subtle/60 py-2 pr-2 pl-4"
    >
      <div class="flex min-w-0 items-baseline gap-2">
        <h3 class="truncate text-sm font-medium text-text-primary">{{ title }}</h3>
        <p v-if="subtitle" class="truncate text-xs text-text-muted">{{ subtitle }}</p>
      </div>

      <button
        type="button"
        class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        :aria-label="removeLabel"
        title="Remover"
        @click="emit('remove')"
      >
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </header>

    <div class="p-4">
      <slot />
    </div>
  </article>
</template>
