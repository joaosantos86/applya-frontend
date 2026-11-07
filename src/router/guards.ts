import type { Router } from 'vue-router'

import { setUnauthorizedHandler } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Exige sessão autenticada. */
    requiresAuth?: boolean
    /** Bloqueada para usuários já autenticados (login/cadastro). */
    guestOnly?: boolean
    /** Título do documento. */
    title?: string
  }
}

const DEFAULT_TITLE = 'Applya — Currículos feitos para você'

/**
 * Guardas de navegação e tratamento global de sessão.
 *
 * - aguarda a verificação inicial da sessão (uma única chamada a `/me`);
 * - redireciona convidados para `/login` preservando a rota pedida em
 *   `?redirect=` (validada depois pelo login via `isInternalPath`);
 * - redireciona autenticados para `/dashboard` ao visitar login/cadastro;
 * - registra o handler de 401 do cliente HTTP: se a sessão expirar com o
 *   usuário em uma rota privada, o estado local é descartado e ele volta ao
 *   login. Em rotas públicas (ex.: erro de credenciais no login) o handler
 *   apenas limpa o estado — a view trata o erro localmente.
 */
export function registerGuards(router: Router): void {
  setUnauthorizedHandler(() => {
    const auth = useAuthStore()
    auth.clearSession()

    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      void router.push({ name: 'login', query: { redirect: current.fullPath } })
    }
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.initialized) {
      await auth.initialize()
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Applya` : DEFAULT_TITLE
  })
}
