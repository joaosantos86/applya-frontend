<script setup lang="ts">
import { CircleCheck, TriangleAlert } from '@lucide/vue'

withDefaults(
  defineProps<{
    /** `error` (role="alert") ou `success` (role="status"). */
    variant?: 'error' | 'success'
    message: string
  }>(),
  {
    variant: 'error',
  },
)
</script>

<template>
  <div
    :role="variant === 'error' ? 'alert' : 'status'"
    class="flex items-start gap-2.5 rounded-lg border p-3 text-sm"
    :class="
      variant === 'error'
        ? 'border-error/30 bg-error/5 text-error'
        : 'border-success/30 bg-success/5 text-success'
    "
  >
    <TriangleAlert v-if="variant === 'error'" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <CircleCheck v-else class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span>{{ message }}</span>
  </div>
</template>
