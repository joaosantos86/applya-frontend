<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    /** Rótulo acessível do botão de fechar. */
    closeLabel?: string
    /** Largura do painel: `md` (formulários curtos) ou `lg` (listas). */
    size?: 'md' | 'lg'
  }>(),
  {
    description: undefined,
    closeLabel: 'Fechar',
    size: 'md',
  },
)

const emit = defineEmits<{ close: [] }>()

const fallbackId = useId()
const titleId = `modal-title-${fallbackId}`
const descriptionId = `modal-description-${fallbackId}`

const panel = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  if (!panel.value) return []

  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = focusableElements()
  if (!focusable.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    document.body.classList.toggle('overflow-hidden', open)

    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    } else {
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div class="absolute inset-0 bg-overlay/50" aria-hidden="true" @click="emit('close')" />

      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="-1"
        :class="size === 'lg' ? 'max-w-2xl' : 'max-w-md'"
        class="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-6 shadow-lg focus:outline-none sm:rounded-xl"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 :id="titleId" class="text-base font-semibold text-text-primary">{{ title }}</h2>
            <p v-if="description" :id="descriptionId" class="mt-1 text-sm text-text-secondary">
              {{ description }}
            </p>
          </div>

          <button
            type="button"
            class="-mt-1 -mr-1 rounded-md p-1.5 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            :aria-label="closeLabel"
            @click="emit('close')"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <slot />
      </div>
    </div>
  </Teleport>
</template>
