<script setup lang="ts">
import { ref, useId } from 'vue'
import { Plus, X } from '@lucide/vue'

withDefaults(
  defineProps<{
    label: string
    placeholder?: string
    hint?: string
    addLabel?: string
  }>(),
  {
    placeholder: 'Digite e pressione Enter',
    hint: undefined,
    addLabel: 'Adicionar',
  },
)

const model = defineModel<string[]>({ required: true })
const emit = defineEmits<{ change: [] }>()

const fallbackId = useId()
const inputId = `tags-${fallbackId}`
const hintId = `${inputId}-hint`

const draft = ref('')

function addTag() {
  const value = draft.value.trim()
  if (!value) return

  const exists = model.value.some((tag) => tag.toLowerCase() === value.toLowerCase())
  if (!exists) {
    model.value = [...model.value, value]
    emit('change')
  }

  draft.value = ''
}

function removeTag(tag: string) {
  model.value = model.value.filter((item) => item !== tag)
  emit('change')
}
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-text-primary">
      {{ label }}
    </label>

    <div class="flex gap-2">
      <input
        :id="inputId"
        v-model="draft"
        type="text"
        :placeholder="placeholder"
        :aria-describedby="hint ? hintId : undefined"
        class="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-primary shadow-xs transition-colors duration-150 placeholder:text-text-muted/70 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring motion-reduce:transition-none"
        @keydown.enter.prevent="addTag"
        @input.stop
      />

      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-primary shadow-xs transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        @click="addTag"
      >
        <Plus class="size-4" aria-hidden="true" />
        {{ addLabel }}
      </button>
    </div>

    <p v-if="hint" :id="hintId" class="mt-1.5 text-xs text-text-secondary">{{ hint }}</p>

    <ul v-if="model.length" class="mt-3 flex flex-wrap gap-2" :aria-label="`${label} adicionadas`">
      <li
        v-for="tag in model"
        :key="tag"
        class="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-subtle pr-1 pl-2 text-sm text-text-primary"
      >
        {{ tag }}
        <button
          type="button"
          class="rounded p-0.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          :aria-label="`Remover ${tag}`"
          @click="removeTag(tag)"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p v-else class="mt-3 text-sm text-text-secondary">Nenhum item adicionado ainda.</p>
  </div>
</template>
