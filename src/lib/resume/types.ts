/**
 * Modelo de dados do currículo.
 *
 * Essas interfaces representam o contrato local usado pelo workspace. Quando a
 * API de currículos existir, o formato pode ser mapeado para/da API sem que os
 * componentes de apresentação precisem mudar (ver `lib/resume/storage.ts`).
 */

/** Dados pessoais e de contato. */
export interface ResumePersonal {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
}

export interface ResumeExperience {
  id: string
  company: string
  role: string
  location: string
  /** Formato `AAAA-MM`. */
  startDate: string
  /** Formato `AAAA-MM`; ignorado quando `current` é true. */
  endDate: string
  current: boolean
  description: string
}

export interface ResumeEducation {
  id: string
  institution: string
  course: string
  degree: string
  /** Período livre, ex.: "2015 — 2019". */
  period: string
  description: string
}

export interface ResumeProject {
  id: string
  name: string
  description: string
  technologies: string[]
  url: string
  repository: string
}

export interface ResumeLanguage {
  id: string
  name: string
  proficiency: LanguageProficiency
}

/** Níveis de proficiência oferecidos no editor. */
export const LANGUAGE_PROFICIENCIES = [
  'Básico',
  'Intermediário',
  'Avançado',
  'Fluente',
  'Nativo',
] as const

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCIES)[number]

export interface Resume {
  id: string
  /** Nome exibido na sidebar. O currículo-base usa "Currículo-base". */
  name: string
  kind: 'base' | 'version'
  /** Id do currículo-base que originou a versão; `null` no próprio base. */
  baseId: string | null
  createdAt: string
  updatedAt: string
  personal: ResumePersonal
  summary: string
  experiences: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  projects: ResumeProject[]
  languages: ResumeLanguage[]
}

/** Snapshot persistido no localStorage. */
export interface ResumeWorkspaceSnapshot {
  schemaVersion: number
  base: Resume
  versions: Resume[]
  selectedId: string
  savedAt: string
}

/** Formato usado pela camada de storage; facilita trocar por API depois. */
export interface ResumeWorkspaceData {
  base: Resume
  versions: Resume[]
  selectedId: string
}
