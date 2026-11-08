/**
 * Validações específicas do editor de currículo.
 *
 * Mantidas puras para serem usadas em computeds e testadas isoladamente.
 */
import { isValidEmail } from '@/lib/validation'
import type { ResumePersonal } from './types'

export interface PersonalErrors {
  fullName?: string
  email?: string
  phone?: string
}

export function validatePersonal(personal: ResumePersonal): PersonalErrors {
  const errors: PersonalErrors = {}

  if (!personal.fullName.trim()) {
    errors.fullName = 'Informe seu nome completo.'
  }

  if (personal.email.trim() && !isValidEmail(personal.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (personal.phone.trim() && personal.phone.trim().length < 8) {
    errors.phone = 'Informe um telefone válido.'
  }

  return errors
}
