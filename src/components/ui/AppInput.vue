<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    /** Texto auxiliar exibido abaixo do campo. */
    hint?: string
    /** Mensagem de erro; quando presente, estiliza o campo como inválido. */
    error?: string
    autocomplete?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    type: 'text',
    hint: undefined,
    error: undefined,
    autocomplete: undefined,
    placeholder: undefined,
    disabled: false,
    required: false,
  },
)

const model = defineModel<string>({ required: true })

const fallbackId = useId()
const inputId = `input-${fallbackId}`
const errorId = `${inputId}-error`
const hintId = `${inputId}-hint`

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.error) ids.push(errorId)
  else if (props.hint) ids.push(hintId)
  return ids.join(' ') || undefined
})
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-text-primary">
      {{ label }}
    </label>

    <div class="relative">
      <input
        :id="inputId"
        v-model="model"
        :type="type"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        class="h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors duration-150 placeholder:text-text-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        :class="[error ? 'border-error' : 'border-border', $slots.trailing ? 'pr-11' : '']"
        v-bind="$attrs"
      />

      <div v-if="$slots.trailing" class="absolute inset-y-0 right-0 flex items-center pr-2">
        <slot name="trailing" />
      </div>
    </div>

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm text-error">
      <slot name="error" :error="error">{{ error }}</slot>
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-sm text-text-secondary">
      {{ hint }}
    </p>
  </div>
</template>
