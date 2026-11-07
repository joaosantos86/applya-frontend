/**
 * Integração com os endpoints de autenticação do backend Go.
 *
 * Contratos reais (ver `internal/http/handlers/auth.go` em applya-backend):
 *
 * | POST /api/v1/auth/register            | 201 {user, verification_email_sent}        |
 * | POST /api/v1/auth/verify-email        | 200 {message}; 400 invalid/expired/used    |
 * | POST /api/v1/auth/resend-verification | 202 {message} (sempre genérico)            |
 * | POST /api/v1/auth/login               | 200 {user} + cookie de sessão HTTP-only    |
 * | GET  /api/v1/auth/me                  | 200 {user} (requer sessão)                 |
 * | POST /api/v1/auth/logout              | 204 (idempotente)                          |
 * | POST /api/v1/auth/forgot-password     | 202 {message} (sempre genérico)            |
 * | POST /api/v1/auth/reset-password      | 200 {message}; body {token, new_password}  |
 * | GET  /api/v1/auth/csrf                | 200 {csrf_token} (usado pelo client)       |
 *
 * Erros seguem `{"error": {"code", "message", "request_id"}}` e devem ser
 * tratados por `code` (nunca pelo texto). Cookies de sessão são HTTP-only:
 * nada aqui é armazenado no localStorage — o client usa `credentials: 'include'`.
 */
import { ApiError, apiRequest } from './client'

/** Usuário autenticado retornado pela API. */
export interface AuthUser {
  id: string
  name: string
  email: string
  email_verified: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

/** Resposta do cadastro (201). */
export interface RegisterResult {
  user: AuthUser
  /** false = o e-mail de confirmação falhou; a conta foi criada mesmo assim. */
  verification_email_sent: boolean
}

interface UserResponse {
  user: AuthUser
}

interface MessageResponse {
  message: string
}

/**
 * Cria uma conta. O usuário NÃO é autenticado automaticamente: o e-mail
 * precisa ser confirmado antes do primeiro login.
 */
export function register(input: RegisterInput): Promise<RegisterResult> {
  return apiRequest<RegisterResult>('/api/v1/auth/register', { method: 'POST', body: input })
}

/** Autentica com e-mail/senha e devolve o usuário da sessão (cookie setado pelo backend). */
export async function login(input: LoginInput): Promise<AuthUser> {
  const { user } = await apiRequest<UserResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: input,
  })
  return user
}

/** Encerra a sessão atual no servidor. Idempotente (204). */
export function logout(): Promise<void> {
  return apiRequest<void>('/api/v1/auth/logout', { method: 'POST' })
}

/** Consulta o usuário da sessão atual (validação real pelo backend). */
export async function me(): Promise<AuthUser> {
  const { user } = await apiRequest<UserResponse>('/api/v1/auth/me')
  return user
}

/** Consome o token de confirmação de e-mail recebido por link. */
export function verifyEmail(token: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { token },
  })
}

/** Solicita o reenvio do e-mail de confirmação (resposta sempre genérica). */
export function resendVerification(email: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { email },
  })
}

/** Solicita o link de recuperação de senha (resposta sempre genérica). */
export async function forgotPassword(email: string): Promise<MessageResponse> {
  const result = await apiRequest<unknown>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: { email },
    expectedStatus: 202,
  })
  if (
    !result ||
    typeof result !== 'object' ||
    !('message' in result) ||
    typeof result.message !== 'string' ||
    !result.message.trim()
  ) {
    throw new ApiError(
      202,
      'unexpected_response',
      'Resposta inesperada do servidor. Tente novamente.',
    )
  }
  return { message: result.message }
}

/**
 * Redefine a senha com o token recebido por e-mail. Não autentica o usuário
 * (todas as sessões anteriores são revogadas pelo backend).
 */
export function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  })
}
