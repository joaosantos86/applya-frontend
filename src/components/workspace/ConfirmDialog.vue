<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <AppModal :open="open" :title="title" :description="description" @close="emit('close')">
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <AppButton variant="ghost" @click="emit('close')">{{ cancelLabel }}</AppButton>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md bg-error px-4 text-sm font-medium text-on-error shadow-xs transition-colors duration-150 hover:bg-error/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </AppModal>
</template>
