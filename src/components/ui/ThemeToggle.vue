<script setup lang="ts">
import { computed } from 'vue'
import { Monitor, Moon, Sun } from '@lucide/vue'

import { useTheme } from '@/composables/useTheme'

const { preference, cycleTheme } = useTheme()

const labels = {
  system: 'Tema: automático (sistema)',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
} as const

const icons = { system: Monitor, light: Sun, dark: Moon } as const

const label = computed(() => labels[preference.value])
const icon = computed(() => icons[preference.value])
</script>

<template>
  <button
    type="button"
    class="rounded-md p-1.5 text-text-muted transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    :aria-label="`${label}. Alterar tema`"
    :title="label"
    @click="cycleTheme"
  >
    <component :is="icon" class="size-4" aria-hidden="true" />
  </button>
</template>
