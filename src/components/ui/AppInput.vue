<script setup lang="ts">
import { computed, inject, useId } from 'vue'

import { controlSizeKey } from './controlSize'

// Os atributos extras (maxlength, autocomplete, listeners…) vão só para o
// <input> via `v-bind="$attrs"`, não também para o elemento raiz.
defineOptions({ inheritAttrs: false })

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
    /** Esconde o rótulo visualmente (continua disponível para leitores de tela). */
    hideLabel?: boolean
    /** Texto fixo antes do campo, que não pode ser editado (ex.: "https://github.com/"). */
    prefix?: string
  }>(),
  {
    type: 'text',
    hint: undefined,
    error: undefined,
    autocomplete: undefined,
    placeholder: undefined,
    disabled: false,
    required: false,
    hideLabel: false,
    prefix: undefined,
  },
)

const model = defineModel<string>({ required: true })

const size = inject(controlSizeKey, 'md')

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
    <label v-if="hideLabel" :for="inputId" class="sr-only">{{ label }}</label>
    <div v-else class="mb-1.5 flex items-baseline justify-between gap-3">
      <label :for="inputId" class="text-sm font-medium text-text-primary">
        {{ label }}
      </label>
      <!-- Ação ao lado do rótulo (ex.: "Esqueceu sua senha?"). -->
      <slot name="label-aside" />
    </div>

    <div class="relative" :class="prefix ? 'flex' : ''">
      <span
        v-if="prefix"
        class="inline-flex shrink-0 items-center rounded-l-md border border-r-0 bg-subtle px-3 text-sm text-text-muted select-none"
        :class="[size === 'lg' ? 'h-10' : 'h-9', error ? 'border-error' : 'border-border']"
        aria-hidden="true"
      >
        {{ prefix }}
      </span>
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
        class="w-full rounded-md border bg-surface px-3 text-sm text-text-primary shadow-xs transition-colors duration-150 placeholder:text-text-muted/70 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        :class="[
          size === 'lg' ? 'h-10' : 'h-9',
          error ? 'border-error' : 'border-border',
          $slots.trailing ? 'pr-11' : '',
          $slots.leading ? 'pl-10' : '',
          prefix ? 'min-w-0 flex-1 rounded-l-none' : '',
        ]"
        v-bind="$attrs"
      />

      <div
        v-if="$slots.leading"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted"
      >
        <slot name="leading" />
      </div>

      <div v-if="$slots.trailing" class="absolute inset-y-0 right-0 flex items-center pr-2">
        <slot name="trailing" />
      </div>
    </div>

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm text-error">
      <slot name="error" :error="error">{{ error }}</slot>
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-xs text-text-secondary">
      {{ hint }}
    </p>
  </div>
</template>
