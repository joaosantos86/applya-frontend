/**
 * Cliente HTTP centralizado para a API do Applya.
 *
 * Toda comunicação com o backend Go passa por `apiRequest`. As regras aqui
 * valem para qualquer funcionalidade futura:
 *
 * - cookies de sessão são enviados sempre (`credentials: 'include'`);
 * - CSRF (double-submit do backend): toda mutação (POST/PUT/PATCH/DELETE)
 *   obtém o token via `GET /api/v1/auth/csrf` e o devolve no header
 *   `X-CSRF-Token`. O token é cacheado; um 403 `csrf_failed` invalida o cache
 *   e repete a mutação uma única vez (o backend rotaciona o token no login);
 * - timeout por requisição (AbortController);
 * - erros são normalizados para {@link ApiError} usando o formato real do
 *   backend: `{"error": {"code": "...", "message": "...", "request_id": "..."}}`
 *   (ver `internal/http/response` no repositório applya-backend);
 * - falhas de rede/timeout viram {@link NetworkError}, sem detalhes internos.
 */

/** Tempo máximo de espera de uma requisição antes de abortar. */
export const REQUEST_TIMEOUT_MS = 10_000

/** Métodos que mudam estado e exigem o token CSRF do backend. */
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** URL base da API (VITE_API_URL), sem barra final. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(
  /\/+$/,
  '',
)

// Em produção, apontar para localhost por falta de configuração é um erro de
// deploy: avise claramente (sem expor nenhum dado sensível).
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[Applya] VITE_API_URL não está definida. As requisições usarão http://localhost:8080. ' +
      'Configure VITE_API_URL no ambiente de deploy.',
  )
}

/** Erro retornado pela API, com o formato padronizado do backend. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string
  /** Segundos sugeridos pelo header `Retry-After` (respostas 429). */
  readonly retryAfterSeconds?: number

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.retryAfterSeconds = retryAfterSeconds
  }

  /** true quando a resposta foi 401 (não autenticado). */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** true quando a resposta foi 403 (autenticado, sem permissão). */
  get isForbidden(): boolean {
    return this.status === 403
  }
}

/** Falha de conexão ou timeout. Não é um erro da API. */
export class NetworkError extends Error {
  constructor(message = 'Falha de conexão com o servidor.') {
    super(message)
    this.name = 'NetworkError'
  }
}

interface ErrorBody {
  error?: {
    code?: string
    message?: string
    request_id?: string
  }
}

/** Mensagens genéricas usadas quando o corpo de erro não traz `message`. */
const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida.',
  401: 'Não autenticado. Faça login novamente.',
  403: 'Acesso negado.',
  404: 'Recurso não encontrado.',
  409: 'Conflito na requisição.',
  422: 'Dados inválidos.',
  429: 'Muitas requisições. Tente novamente em instantes.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
}

function parseRetryAfter(headers?: Headers): number | undefined {
  const raw = headers?.get('Retry-After')
  if (!raw) return undefined
  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined
}

function normalizeApiError(status: number, payload: unknown, headers?: Headers): ApiError {
  const body = (payload ?? {}) as ErrorBody
  const err = body.error

  // Defesa em profundidade: para erros de servidor (5xx), NUNCA use a
  // mensagem do corpo — vazamentos internos do backend (SQL, stack, detalhes
  // de infraestrutura) jamais devem chegar ao usuário. Para 4xx a mensagem é
  // legítima (validações/negócio) e já é "user-safe" por contrato do backend.
  const message =
    status >= 500
      ? (FALLBACK_MESSAGES[status] ?? 'Algo deu errado. Tente novamente.')
      : (err?.message ?? FALLBACK_MESSAGES[status] ?? 'Algo deu errado. Tente novamente.')

  return new ApiError(
    status,
    err?.code ?? 'unknown',
    message,
    err?.request_id,
    parseRetryAfter(headers),
  )
}

/**
 * Handler global de sessão expirada/revogada (401).
 *
 * A store não é fonte definitiva de autenticação: quando o backend responde
 * 401 em qualquer requisição, a sessão local deve ser descartada. O handler é
 * registrado pelos guards de rota (que sabem redirecionar sem loops).
 */
type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

// ---------------------------------------------------------------------------
// Token CSRF (double-submit do backend)
// ---------------------------------------------------------------------------

let cachedCsrfToken: string | null = null
let csrfRequest: Promise<string> | null = null

/** Busca (e cacheia) o token CSRF. Chamadas concorrentes compartilham a mesma requisição. */
async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken

  if (!csrfRequest) {
    csrfRequest = (async () => {
      const payload = await apiRequest<{ csrf_token: string }>('/api/v1/auth/csrf')
      cachedCsrfToken = payload.csrf_token
      return cachedCsrfToken
    })().finally(() => {
      csrfRequest = null
    })
  }

  return csrfRequest
}

/**
 * Descarta o token CSRF em cache. O backend rotaciona o token no login; a
 * store chama esta função após autenticar para que a próxima mutação já use
 * o token novo.
 */
export function invalidateCsrfToken(): void {
  cachedCsrfToken = null
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Status de sucesso exigido por um endpoint com contrato específico. */
  expectedStatus?: number
  /** Corpo enviado como JSON (convertido aqui). */
  body?: unknown
  /**
   * Formato da resposta de sucesso: `json` (padrão) ou `blob` para arquivos
   * (ex.: PDF). Erros continuam sendo lidos como JSON do backend.
   */
  responseType?: 'json' | 'blob'
}

/**
 * Executa uma requisição contra a API e devolve o corpo JSON.
 *
 * Mutações (POST/PUT/PATCH/DELETE) enviam o header `X-CSRF-Token` obtido do
 * endpoint de CSRF; um 403 `csrf_failed` renova o token e repete uma vez.
 *
 * @throws {ApiError} quando a API responde com status de erro.
 * @throws {NetworkError} em falha de rede ou timeout.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, expectedStatus, responseType = 'json', ...rest } = options
  const method = (options.method ?? 'GET').toUpperCase()
  const needsCsrf = MUTATION_METHODS.has(method)

  async function attempt(retried: boolean): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const csrfToken = needsCsrf ? await fetchCsrfToken() : undefined
      const requestHeaders = new Headers(headers)
      if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json')
      if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
      if (csrfToken !== undefined) requestHeaders.set('X-CSRF-Token', csrfToken)

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        method,
        credentials: 'include',
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (response.ok && expectedStatus !== undefined && response.status !== expectedStatus) {
        throw new ApiError(
          response.status,
          'unexpected_response',
          'Resposta inesperada do servidor. Tente novamente.',
        )
      }

      if (response.status === 204) {
        return undefined as T
      }

      if (response.ok && responseType === 'blob') {
        return (await response.blob()) as T
      }

      const payload = await readPayload(response)

      if (!response.ok) {
        // Sessão expirada/revogada: descarta o estado local antes de lançar.
        // Views de login/verificação tratam o 401 localmente; a redireção
        // global fica a cargo do handler (registrado nos guards de rota).
        if (response.status === 401) {
          unauthorizedHandler?.()
        }

        const apiError = normalizeApiError(response.status, payload, response.headers)

        // Token CSRF rotacionado no servidor (ex.: após login): renova o
        // token e repete a mutação uma única vez.
        if (needsCsrf && !retried && apiError.status === 403 && apiError.code === 'csrf_failed') {
          invalidateCsrfToken()
          return attempt(true)
        }

        throw apiError
      }

      return payload as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('O servidor demorou para responder. Tente novamente.')
      }
      if (error instanceof TypeError) {
        throw new NetworkError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return attempt(false)
}

/**
 * Traduz um erro de requisição para uma mensagem segura para o usuário final.
 * Mensagens de `ApiError` vêm do backend e já são adequadas ao usuário.
 */
export function getUserFacingMessage(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof NetworkError) return error.message
  return fallback
}

/** Formata uma espera (segundos) em pt-BR compacto: "30s", "2 min", "3 h". */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`
  return `${Math.ceil(seconds / 3600)} h`
}

/**
 * Mensagem amigável para erros de rate limit (429), usando o `Retry-After`
 * do backend quando disponível.
 */
export function rateLimitMessage(
  error: unknown,
  fallback = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
): string {
  if (error instanceof ApiError && error.retryAfterSeconds !== undefined) {
    return `Muitas tentativas. Tente novamente em ${formatRetryAfter(error.retryAfterSeconds)}.`
  }
  return fallback
}
