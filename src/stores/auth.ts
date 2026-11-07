/**
 * Estado global de autenticação.
 *
 * Regras:
 * - a sessão é SEMPRE validada pelo backend (`GET /api/v1/auth/me`);
 *   nenhum dado local é tratado como prova de autenticação;
 * - `initialize()` roda no máximo uma vez (deduplicada), acionada pelo guard
 *   de rotas antes da primeira decisão de navegação;
 * - logout limpa o estado local mesmo se a requisição falhar;
 * - um contador de "época" invalida resultados de requisições em voo: se um
 *   `login`/`initialize` pendente resolver DEPOIS de um logout, o resultado
 *   é descartado (não existe "ressurreição" de sessão antiga).
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { login as loginRequest, logout as logoutRequest, me as meRequest } from '@/lib/api/auth'
import { ApiError, invalidateCsrfToken } from '@/lib/api/client'
import type { AuthUser, LoginInput } from '@/lib/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  /** Operação em andamento (login/logout). */
  const loading = ref(false)

  /** true depois que a sessão foi verificada uma vez contra o backend. */
  const initialized = ref(false)

  let initializing: Promise<void> | null = null

  /**
   * Geração da sessão local. Incrementada em `clearSession`/`logout`.
   * Resultados assíncronos só são aplicados se a época não mudou.
   */
  let epoch = 0

  const isAuthenticated = computed(() => user.value !== null)

  /** Revalida a sessão; ausência de cookie é normal, outros erros são propagados. */
  async function fetchMe(): Promise<void> {
    const currentEpoch = epoch
    try {
      const fetched = await meRequest()
      if (epoch === currentEpoch) user.value = fetched
    } catch (error) {
      if (epoch === currentEpoch) user.value = null
      if (!(
        error instanceof ApiError &&
        error.status === 401 &&
        error.code === 'authentication_required'
      )) {
        throw error
      }
    }
  }

  /** Verifica a sessão atual no backend. Executa no máximo uma vez. */
  async function initialize(): Promise<void> {
    if (initialized.value) return
    if (initializing) return initializing

    const currentEpoch = epoch

    initializing = (async () => {
      try {
        await fetchMe()
      } catch {
        // 401, falha de rede ou qualquer outro erro: sem sessão provada.
        if (epoch === currentEpoch) {
          user.value = null
        }
      } finally {
        initialized.value = true
        initializing = null
      }
    })()

    return initializing
  }

  /** Autentica com e-mail/senha. Lança `ApiError`/`NetworkError` para a view. */
  async function login(input: LoginInput): Promise<void> {
    const currentEpoch = epoch
    loading.value = true
    try {
      const logged = await loginRequest(input)
      if (epoch === currentEpoch) {
        user.value = logged
        // O backend rotaciona o token CSRF no login; descarta o token em
        // cache para a próxima mutação buscar o novo.
        invalidateCsrfToken()
      }
    } finally {
      loading.value = false
    }
  }

  /** Descarta o estado local de sessão (sem chamada ao servidor). */
  function clearSession(): void {
    epoch += 1
    user.value = null
  }

  /** Encerra a sessão no servidor e limpa o estado local. */
  async function logout(): Promise<void> {
    loading.value = true
    try {
      await logoutRequest()
    } catch {
      // Mesmo sem resposta do servidor, o estado local é descartado.
    } finally {
      clearSession()
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    initialized,
    fetchMe,
    initialize,
    login,
    logout,
    clearSession,
  }
})
