/**
 * Modelo de dados do currículo usado pelo editor.
 *
 * É o formato local, pensado para os formulários. A conversão de/para o
 * contrato da API (`snake_case`, cidade/estado separados, proficiência em
 * inglês etc.) fica em `lib/resume/mapper.ts`; os componentes não conhecem o
 * formato do backend.
 */

/** Dados pessoais e de contato. */
export interface ResumePersonal {
  fullName: string
  headline: string
  email: string
  phone: string
  /** Cidade e estado em um só campo, ex.: "São Paulo, SP". */
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
  /** Formato `AAAA-MM`. */
  startDate: string
  /** Formato `AAAA-MM`. */
  endDate: string
  description: string
}

export interface ResumeSkill {
  id: string
  name: string
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

/** Metadados de um currículo, sem o conteúdo (lista de versões). */
export interface ResumeSummary {
  id: string
  /** Nome exibido na sidebar. O currículo-base usa "Currículo-base". */
  name: string
  kind: 'base' | 'version'
  /** Id do currículo-base que originou a versão; `null` no próprio base. */
  baseId: string | null
  /** Revisão no servidor; enviada no PATCH para detectar conflitos (409). */
  revision: number
  createdAt: string
  updatedAt: string
}

/** Conteúdo editável de um currículo. */
export interface ResumeContent {
  personal: ResumePersonal
  summary: string
  experiences: ResumeExperience[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  projects: ResumeProject[]
  languages: ResumeLanguage[]
}

export interface Resume extends ResumeSummary, ResumeContent {}
