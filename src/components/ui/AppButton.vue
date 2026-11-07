<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from '@lucide/vue'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    /** Tipo nativo do botão. Use `submit` dentro de formulários. */
    type?: 'button' | 'submit' | 'reset'
    variant?: Variant
    size?: Size
    /** Mostra spinner e desabilita o clique. */
    loading?: boolean
    disabled?: boolean
    /** Ocupa toda a largura disponível. */
    block?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
  },
)

const isDisabled = computed(() => props.disabled || props.loading)

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-text-primary hover:bg-primary-hover',
  outline: 'border border-border bg-surface text-text-primary hover:bg-background',
  ghost: 'text-text-secondary hover:bg-background hover:text-text-primary',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
    :class="[variantClasses[variant], sizeClasses[size], block ? 'w-full' : '']"
  >
    <LoaderCircle v-if="loading" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <slot />
  </button>
</template>
