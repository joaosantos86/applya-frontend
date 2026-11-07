<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AuthIllustration from '@/components/auth/AuthIllustration.vue'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="auth-page flex min-h-svh flex-col bg-background text-text-primary">
    <header
      class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 sm:px-12 sm:py-10"
    >
      <RouterLink
        :to="{ name: 'login' }"
        aria-label="Applya — início"
        class="text-2xl font-extrabold tracking-tighter"
      >
        applya<span class="text-primary-hover">.</span>
      </RouterLink>
      <span class="text-xs text-text-secondary sm:text-sm">Seu próximo capítulo.</span>
    </header>

    <main class="relative isolate flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
      <AuthIllustration />
      <section
        class="auth-card relative w-full max-w-[420px] rounded-[28px] bg-surface px-7 py-10 sm:px-10 sm:py-12"
      >
        <header class="mb-8 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
          <p class="mx-auto mt-3 max-w-[290px] text-sm leading-relaxed text-text-secondary">
            {{ description }}
          </p>
        </header>
        <slot />
        <footer
          v-if="$slots.footer"
          class="mt-8 border-t border-border/60 pt-6 text-center text-xs leading-relaxed text-text-secondary"
        >
          <slot name="footer" />
        </footer>
      </section>
    </main>

    <footer class="px-6 pb-7 pt-4 text-center text-xs text-text-secondary sm:pb-9">
      Um currículo. Muitas possibilidades.
    </footer>
  </div>
</template>

<style scoped>
.auth-card {
  box-shadow: 0 18px 45px -24px color-mix(in srgb, var(--color-text-primary) 18%, transparent);
}

.auth-card :deep(input) {
  height: 46px;
  border-radius: 6px;
  box-shadow: none;
}

.auth-card :deep(button[type='submit']) {
  height: 46px;
  margin-top: 24px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
