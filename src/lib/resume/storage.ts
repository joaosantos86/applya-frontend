/**
 * Persistência temporária do workspace no localStorage.
 *
 * Esta é a única camada que conhece o localStorage. Quando a API de currículos
 * existir, basta trocar as funções abaixo por chamadas HTTP mantendo a mesma
 * assinatura usada pelo store (`loadWorkspace`/`saveWorkspace`).
 *
 * A chave é versionada: se o schema mudar, snapshots antigos são descartados e
 * o workspace volta aos dados iniciais em vez de quebrar a interface.
 */
import { LANGUAGE_PROFICIENCIES } from './types'
import type {
  Resume,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumePersonal,
  ResumeProject,
  ResumeWorkspaceSnapshot,
} from './types'

export const RESUME_STORAGE_KEY = 'applya:resume-workspace:v1'
export const RESUME_SCHEMA_VERSION = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isPersonal(value: unknown): value is ResumePersonal {
  if (!isRecord(value)) return false

  return (
    isString(value.fullName) &&
    isString(value.headline) &&
    isString(value.email) &&
    isString(value.phone) &&
    isString(value.location) &&
    isString(value.linkedin) &&
    isString(value.github) &&
    isString(value.website)
  )
}

function isExperience(value: unknown): value is ResumeExperience {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.company) &&
    isString(value.role) &&
    isString(value.location) &&
    isString(value.startDate) &&
    isString(value.endDate) &&
    isBoolean(value.current) &&
    isString(value.description)
  )
}

function isEducation(value: unknown): value is ResumeEducation {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.institution) &&
    isString(value.course) &&
    isString(value.degree) &&
    isString(value.period) &&
    isString(value.description)
  )
}

function isProject(value: unknown): value is ResumeProject {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    isStringArray(value.technologies) &&
    isString(value.url) &&
    isString(value.repository)
  )
}

function isLanguage(value: unknown): value is ResumeLanguage {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.name) &&
    LANGUAGE_PROFICIENCIES.some((proficiency) => proficiency === value.proficiency)
  )
}

export function isResume(value: unknown): value is Resume {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.name) &&
    (value.kind === 'base' || value.kind === 'version') &&
    (value.baseId === null || isString(value.baseId)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isPersonal(value.personal) &&
    isString(value.summary) &&
    Array.isArray(value.experiences) &&
    value.experiences.every(isExperience) &&
    Array.isArray(value.education) &&
    value.education.every(isEducation) &&
    isStringArray(value.skills) &&
    Array.isArray(value.projects) &&
    value.projects.every(isProject) &&
    Array.isArray(value.languages) &&
    value.languages.every(isLanguage)
  )
}

function isWorkspaceSnapshot(value: unknown): value is ResumeWorkspaceSnapshot {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== RESUME_SCHEMA_VERSION) return false
  if (!isResume(value.base) || value.base.kind !== 'base') return false
  if (!Array.isArray(value.versions) || !value.versions.every(isResume)) return false
  if (!value.versions.every((version) => version.kind === 'version')) return false
  if (!isString(value.selectedId) || !isString(value.savedAt)) return false

  return [value.base, ...value.versions].some((resume) => resume.id === value.selectedId)
}

function removeStoredWorkspace(): void {
  try {
    localStorage.removeItem(RESUME_STORAGE_KEY)
  } catch {
    // Sem acesso ao storage (modo privado/permissões): nada a limpar.
  }
}

/** Lê o snapshot salvo. Dados ausentes, inválidos ou de outra versão são descartados. */
export function loadWorkspace(): ResumeWorkspaceSnapshot | null {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isWorkspaceSnapshot(parsed)) {
      removeStoredWorkspace()
      return null
    }

    return parsed
  } catch {
    removeStoredWorkspace()
    return null
  }
}

/** Salva o snapshot completo. Devolve `false` se o storage estiver indisponível. */
export function saveWorkspace(snapshot: ResumeWorkspaceSnapshot): boolean {
  try {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}
