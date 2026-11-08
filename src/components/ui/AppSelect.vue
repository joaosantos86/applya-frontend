<script setup lang="ts">
import { computed, useId } from 'vue'

interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    label: string
    options: SelectOption[]
    hint?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    hint: undefined,
    error: undefined,
    placeholder: undefined,
    disabled: false,
    required: false,
  },
)

const model = defineModel<string>({ required: true })

const fallbackId = useId()
const selectId = `select-${fallbackId}`
const errorId = `${selectId}-error`
const hintId = `${selectId}-hint`

const describedBy = computed(() => {
  if (props.error) return errorId
  if (props.hint) return hintId
  return undefined
})
</script>

<template>
  <div>
    <label :for="selectId" class="mb-1.5 block text-sm font-medium text-text-primary">
      {{ label }}
    </label>

    <select
      :id="selectId"
      v-model="model"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      class="h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
      :class="error ? 'border-error' : 'border-border'"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm text-error">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-sm text-text-secondary">{{ hint }}</p>
  </div>
</template>
