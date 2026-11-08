<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    id: string
    title: string
    description?: string
    icon: Component
    badge?: string | number
  }>(),
  {
    description: undefined,
    badge: undefined,
  },
)
</script>

<template>
  <section
    :id="id"
    class="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    :aria-labelledby="`${id}-title`"
  >
    <header class="mb-5 flex items-start gap-3">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/25">
        <component :is="icon" class="size-4 text-text-primary" aria-hidden="true" />
      </span>

      <div class="min-w-0 flex-1">
        <h2 :id="`${id}-title`" class="text-base font-semibold text-text-primary">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-0.5 text-sm text-text-secondary">{{ description }}</p>
      </div>

      <span
        v-if="badge !== undefined"
        class="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-text-secondary"
      >
        {{ badge }}
      </span>
    </header>

    <slot />
  </section>
</template>
