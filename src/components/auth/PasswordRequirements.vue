<script setup lang="ts">
import { computed } from 'vue'
import { Check, Minus } from '@lucide/vue'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordChecks } from '@/lib/validation'

const props = defineProps<{
  password: string
}>()

const checks = computed(() => passwordChecks(props.password))

// Regras espelhadas do backend (internal/auth/validation.go): 8 a 256
// caracteres, sem exigência de maiúscula, minúscula ou número.
const items = computed(() => [
  { label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`, met: checks.value.length },
  { label: `No máximo ${PASSWORD_MAX_LENGTH} caracteres`, met: checks.value.maxLength },
])
</script>

<template>
  <div class="rounded-lg border border-border bg-background/60 p-3">
    <p class="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
      Sua senha precisa ter
    </p>
    <ul class="space-y-1.5">
      <li
        v-for="item in items"
        :key="item.label"
        class="flex items-center gap-2 text-sm"
        :class="item.met ? 'text-success' : 'text-text-secondary'"
      >
        <Check v-if="item.met" class="size-4 shrink-0" aria-hidden="true" />
        <Minus v-else class="size-4 shrink-0" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>
