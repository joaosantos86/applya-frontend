<script setup lang="ts">
import { provide } from 'vue'
import { RouterLink } from 'vue-router'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import { controlSizeKey } from '@/components/ui/controlSize'

defineProps<{
  title: string
  description: string
}>()

// Campos maiores nos formulários de autenticação, sem sobrescrever estilos
// dos componentes filhos.
provide(controlSizeKey, 'lg')
</script>

<template>
  <!-- Telas de autenticação: sempre escuras (escopo `.ink`). Uma moldura com
       borda fina ocupa a tela; o formulário fica estreito, no centro. -->
  <div class="ink flex min-h-svh bg-background p-3 text-text-primary sm:p-6 lg:p-10">
    <div class="flex flex-1 flex-col rounded-3xl border border-border px-6 sm:px-10">
      <header class="flex h-20 items-center">
        <RouterLink :to="{ name: 'login' }" aria-label="Applya — início">
          <AppWordmark />
        </RouterLink>
      </header>

      <main class="flex flex-1 items-center justify-center py-8">
        <section class="w-full max-w-[360px]">
          <header class="mb-8">
            <h1 class="text-xs font-medium tracking-[0.18em] text-text-primary uppercase">
              {{ title }}
            </h1>
            <p class="mt-2 text-sm text-text-secondary">{{ description }}</p>
          </header>

          <slot />

          <footer v-if="$slots.footer" class="mt-12 text-center text-sm text-text-secondary">
            <slot name="footer" />
          </footer>
        </section>
      </main>

      <footer class="flex h-20 items-center justify-center text-xs text-text-muted">
        © 2026 Applya
      </footer>
    </div>
  </div>
</template>
