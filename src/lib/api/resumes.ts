/**
 * Integração com os endpoints de currículos do backend Go.
 *
 * Contratos reais (ver `internal/http/handlers/resumes.go` e
 * `github_import.go` em applya-backend). Todas as rotas exigem sessão.
 *
 * | GET    /api/v1/workspace                      | 200 {user, base, versions: Summary[]}     |
 * | GET    /api/v1/resumes/base                   | 200 {resume}                              |
 * | PATCH  /api/v1/resumes/base                   | 200 {resume}; 409 conflict                |
 * | POST   /api/v1/resumes/versions               | 201 {resume} (cópia do base salvo)        |
 * | GET    /api/v1/resumes/versions/{id}          | 200 {resume}                              |
 * | PATCH  /api/v1/resumes/versions/{id}          | 200 {resume}; 409 conflict                |
 * | DELETE /api/v1/resumes/versions/{id}          | 204                                       |
 * | GET    /api/v1/resumes/imports/github?username | 200 {github, projects, skills, truncated} |
 * | POST   /api/v1/resumes/export/pdf             | 200 application/pdf; 400; 429 Retry-After |
 *
 * PATCH: cada seção enviada em `data` SUBSTITUI a coleção inteira no servidor.
 * `revision` é a revisão conhecida pelo cliente; se o servidor já tiver outra,
 * responde 409 `conflict`. A prévia do GitHub não grava nada.
 *
 * Exportação: o corpo é o mesmo `data` do PATCH (com alterações não salvas) e
 * passa pela mesma validação; o backend devolve o PDF pronto.
 */
import { apiRequest } from './client'

export type ApiResumeType = 'base' | 'version'

export type ApiProficiency = 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native'

export interface ApiPersonal {
  full_name: string
  title: string
  email: string
  phone: string
  city: string
  state: string
  linkedin: string
  github: string
  website: string
}

export interface ApiExperience {
  id: string
  company: string
  role: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string
  display_order: number
}

export interface ApiEducation {
  id: string
  institution: string
  course: string
  degree: string
  start_date: string
  end_date: string
  description: string
  display_order: number
}

export interface ApiSkill {
  id: string
  name: string
  display_order: number
}

export interface ApiProject {
  id: string
  name: string
  description: string
  technologies: string[]
  url: string
  repository: string
  display_order: number
}

export interface ApiLanguage {
  id: string
  language: string
  proficiency: ApiProficiency
  display_order: number
}

export interface ApiResumeData {
  personal: ApiPersonal
  summary: string
  experiences: ApiExperience[]
  education: ApiEducation[]
  skills: ApiSkill[]
  projects: ApiProject[]
  languages: ApiLanguage[]
}

export interface ApiResumeSummary {
  id: string
  type: ApiResumeType
  name: string
  base_resume_id: string | null
  revision: number
  created_at: string
  updated_at: string
}

export interface ApiResume extends ApiResumeSummary {
  data: ApiResumeData
}

export interface ApiWorkspace {
  base: ApiResume
  versions: ApiResumeSummary[]
}

/** Corpo do PATCH. Seções ausentes em `data` não são alteradas. */
export interface ResumePatch {
  name?: string
  data?: Partial<ApiResumeData>
  revision: number
}

/** Prévia da importação do GitHub (não grava nada). */
export interface GitHubImportPreview {
  /** URL do perfil no GitHub. */
  github: string
  projects: ApiProject[]
  skills: ApiSkill[]
  /** true quando a lista é parcial (limite de repositórios/projetos). */
  truncated: boolean
}

interface ResumeResponse {
  resume: ApiResume
}

export function fetchWorkspace(): Promise<ApiWorkspace> {
  return apiRequest<ApiWorkspace>('/api/v1/workspace')
}

export async function fetchBase(): Promise<ApiResume> {
  const { resume } = await apiRequest<ResumeResponse>('/api/v1/resumes/base')
  return resume
}

export async function fetchVersion(id: string): Promise<ApiResume> {
  const { resume } = await apiRequest<ResumeResponse>(
    `/api/v1/resumes/versions/${encodeURIComponent(id)}`,
  )
  return resume
}

export async function updateBase(patch: ResumePatch): Promise<ApiResume> {
  const { resume } = await apiRequest<ResumeResponse>('/api/v1/resumes/base', {
    method: 'PATCH',
    body: patch,
  })
  return resume
}

export async function updateVersion(id: string, patch: ResumePatch): Promise<ApiResume> {
  const { resume } = await apiRequest<ResumeResponse>(
    `/api/v1/resumes/versions/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: patch },
  )
  return resume
}

export async function createVersion(name: string): Promise<ApiResume> {
  const { resume } = await apiRequest<ResumeResponse>('/api/v1/resumes/versions', {
    method: 'POST',
    body: { name },
    expectedStatus: 201,
  })
  return resume
}

export function deleteVersion(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/resumes/versions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function previewGitHubImport(username: string): Promise<GitHubImportPreview> {
  const query = new URLSearchParams({ username })
  return apiRequest<GitHubImportPreview>(`/api/v1/resumes/imports/github?${query.toString()}`)
}

/** Gera o PDF do conteúdo enviado (pode incluir alterações não salvas). */
export function exportResumePdf(data: ApiResumeData): Promise<Blob> {
  return apiRequest<Blob>('/api/v1/resumes/export/pdf', {
    method: 'POST',
    body: data,
    headers: { Accept: 'application/pdf' },
    responseType: 'blob',
  })
}
