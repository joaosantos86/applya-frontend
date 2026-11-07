/**
 * Validações de formulários de autenticação.
 *
 * Funções puras, sem dependências, usadas pelas views e testáveis isoladamente.
 * As regras espelham a validação REAL do backend (internal/auth/validation.go):
 * nome obrigatório (máx. 100), e-mail válido (máx. 254, normalizado para
 * minúsculas) e senha de 8 a 256 caracteres — sem exigência de maiúscula,
 * minúscula ou número.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 256
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string): boolean {
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(value)
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Normaliza um e-mail como o backend faz (internal/auth/validation.go):
 * remove espaços e converte para minúsculas. Enviar já normalizado evita
 * contas duplicadas e mensagens de validação do servidor.
 */
export function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase()
}

/** Estado de cada requisito da senha, para o indicador visual. */
export interface PasswordChecks {
  length: boolean
  maxLength: boolean
}

export function passwordChecks(value: string): PasswordChecks {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    maxLength: value.length <= PASSWORD_MAX_LENGTH,
  }
}

export interface LoginFormErrors {
  email?: string
  password?: string
}

export function validateLogin(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {}

  if (!isNonEmpty(email)) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!isNonEmpty(password)) {
    errors.password = 'Informe sua senha.'
  }

  return errors
}

export interface RegisterFormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function validateRegister(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {}

  if (!isNonEmpty(name)) {
    errors.name = 'Informe seu nome completo.'
  } else if (name.trim().length < NAME_MIN_LENGTH) {
    errors.name = `O nome deve ter pelo menos ${NAME_MIN_LENGTH} caracteres.`
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`
  }

  if (!isNonEmpty(email)) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!isNonEmpty(password)) {
    errors.password = 'Crie uma senha.'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  }

  if (!isNonEmpty(confirmPassword)) {
    errors.confirmPassword = 'Confirme sua senha.'
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return errors
}

export interface ResetPasswordFormErrors {
  password?: string
  confirmPassword?: string
}

export function validateResetPassword(
  password: string,
  confirmPassword: string,
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {}

  if (!isNonEmpty(password)) {
    errors.password = 'Crie uma nova senha.'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  }

  if (!isNonEmpty(confirmPassword)) {
    errors.confirmPassword = 'Confirme a nova senha.'
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return errors
}

export interface ForgotPasswordFormErrors {
  email?: string
}

export function validateForgotPassword(email: string): ForgotPasswordFormErrors {
  const errors: ForgotPasswordFormErrors = {}

  if (!isNonEmpty(email)) {
    errors.email = 'Informe seu e-mail.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  return errors
}

/**
 * true quando há pelo menos um erro com valor real.
 *
 * Campos opcionais podem existir no objeto como `undefined` (limpos durante
 * a digitação); eles não contam como erro.
 */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((value) => value !== undefined && value !== null)
}
