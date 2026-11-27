<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

import AppInput from './AppInput.vue'

// Os atributos extras (maxlength, autocomplete, listeners…) vão só para o
// <input> via `v-bind="$attrs"`, não também para o elemento raiz.
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label: string
    autocomplete?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    autocomplete: undefined,
    error: undefined,
    hint: undefined,
    disabled: false,
    required: false,
  },
)

const model = defineModel<string>({ required: true })

const visible = ref(false)

function toggleVisibility() {
  visible.value = !visible.value
}
</script>

<template>
  <AppInput
    v-model="model"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :error="error"
    :hint="hint"
    :disabled="disabled"
    :required="required"
    v-bind="$attrs"
  >
    <template v-if="$slots['label-aside']" #label-aside>
      <slot name="label-aside" />
    </template>

    <template v-if="$slots.leading" #leading>
      <slot name="leading" />
    </template>

    <template #trailing>
      <button
        type="button"
        class="rounded-md p-1.5 text-text-muted transition-colors duration-150 hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="toggleVisibility"
      >
        <EyeOff v-if="visible" class="size-4" aria-hidden="true" />
        <Eye v-else class="size-4" aria-hidden="true" />
      </button>
    </template>
  </AppInput>
</template>
