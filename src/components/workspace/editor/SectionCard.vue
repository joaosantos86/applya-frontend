<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    title: string
    description?: string
    badge?: string | number
  }>(),
  {
    description: undefined,
    badge: undefined,
  },
)
</script>

<template>
  <section :id="id" class="scroll-mt-12 py-8" :aria-labelledby="`${id}-title`">
    <header class="mb-6 flex items-baseline justify-between gap-4">
      <div class="min-w-0">
        <h2 :id="`${id}-title`" class="text-base font-semibold text-text-primary">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-1 text-sm text-text-secondary">{{ description }}</p>
      </div>

      <span v-if="badge !== undefined" class="shrink-0 text-xs text-text-muted tabular-nums">
        {{ badge }} {{ badge === 1 ? 'item' : 'itens' }}
      </span>
    </header>

    <slot />
  </section>
</template>
