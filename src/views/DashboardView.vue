<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FileText, LogOut } from '@lucide/vue'

import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Placeholder do painel interno.
 *
 * Existe apenas para demonstrar o fluxo de rotas privadas (login → painel →
 * logout). As funcionalidades reais (currículos, perfil) virão em etapas
 * futuras.
 */
const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-4 py-10">
    <div class="w-full max-w-lg">
      <section class="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <header class="mb-6 flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-xl bg-primary">
            <FileText class="size-5 text-text-primary" aria-hidden="true" />
          </span>
          <div>
            <h1 class="text-lg font-semibold text-text-primary">
              Olá, {{ auth.user?.name }}!
            </h1>
            <p class="text-sm text-text-secondary">{{ auth.user?.email }}</p>
          </div>
        </header>

        <p class="text-sm text-text-secondary">
          Este é um painel provisório. As funcionalidades de currículos serão implementadas em
          breve.
        </p>

        <div class="mt-6">
          <AppButton variant="outline" :loading="auth.loading" @click="onLogout">
            <LogOut class="size-4" aria-hidden="true" />
            Sair da conta
          </AppButton>
        </div>
      </section>
    </div>
  </main>
</template>
