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
  <article class="rounded-xl border border-border bg-background/40 p-4">
    <header class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-text-primary">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 truncate text-xs text-text-secondary">{{ subtitle }}</p>
      </div>

      <button
        type="button"
        class="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="removeLabel"
        @click="emit('remove')"
      >
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </header>

    <slot />
  </article>
</template>
