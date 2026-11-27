<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert, X } from '@lucide/vue'

import { useToast } from '@/composables/useToast'

const { toasts, dismissToast } = useToast()

const variantClasses = {
  success: 'border-success/30 bg-surface text-text-primary',
  info: 'border-border bg-surface text-text-primary',
  error: 'border-error/30 bg-surface text-text-primary',
} as const

const iconClasses = {
  success: 'text-success',
  info: 'text-text-secondary',
  error: 'text-error',
} as const
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    aria-live="polite"
    aria-atomic="false"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      role="status"
      class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border py-3 pr-2 pl-4 text-sm shadow-lg"
      :class="variantClasses[toast.variant]"
    >
      <CircleCheck
        v-if="toast.variant === 'success'"
        class="size-4 shrink-0"
        :class="iconClasses.success"
        aria-hidden="true"
      />
      <TriangleAlert
        v-else-if="toast.variant === 'error'"
        class="size-4 shrink-0"
        :class="iconClasses.error"
        aria-hidden="true"
      />
      <Info v-else class="size-4 shrink-0" :class="iconClasses.info" aria-hidden="true" />

      <span class="flex-1">{{ toast.message }}</span>

      <button
        type="button"
        class="rounded-md p-1 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Fechar notificação"
        @click="dismissToast(toast.id)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
