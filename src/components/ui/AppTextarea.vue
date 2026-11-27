<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    hint: undefined,
    error: undefined,
    placeholder: undefined,
    rows: 4,
    disabled: false,
    required: false,
  },
)

const model = defineModel<string>({ required: true })

const fallbackId = useId()
const textareaId = `textarea-${fallbackId}`
const errorId = `${textareaId}-error`
const hintId = `${textareaId}-hint`

const describedBy = computed(() => {
  if (props.error) return errorId
  if (props.hint) return hintId
  return undefined
})
</script>

<template>
  <div>
    <label :for="textareaId" class="mb-1.5 block text-sm font-medium text-text-primary">
      {{ label }}
    </label>

    <textarea
      :id="textareaId"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      class="w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm leading-relaxed text-text-primary shadow-xs transition-colors duration-150 placeholder:text-text-muted/70 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
      :class="error ? 'border-error' : 'border-border'"
      v-bind="$attrs"
    />

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm text-error">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-xs text-text-secondary">{{ hint }}</p>
  </div>
</template>
