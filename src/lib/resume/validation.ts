/**
 * Validações específicas do editor de currículo.
 *
 * Mantidas puras para serem usadas em computeds e testadas isoladamente.
 */
import { isValidEmail } from '@/lib/validation'
import { githubUserFromProfile, isValidGitHubUsername } from './githubImport'
import type { ResumePersonal } from './types'

export interface PersonalErrors {
  fullName?: string
  email?: string
  phone?: string
  github?: string
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

  const githubUser = githubUserFromProfile(personal.github)
  if (githubUser && !isValidGitHubUsername(githubUser)) {
    errors.github = 'Use só o seu usuário do GitHub (letras, números e hífens).'
  }

  return errors
}
