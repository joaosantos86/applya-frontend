/**
 * Conversão entre o formato local do editor (`lib/resume/types.ts`) e o
 * contrato da API de currículos (`lib/api/resumes.ts`).
 *
 * Diferenças tratadas aqui:
 * - `headline` ↔ `title`; `location` ("cidade, UF") ↔ `city` + `state`;
 * - proficiência dos idiomas em pt-BR ↔ enum em inglês do backend;
 * - `display_order` existe só na API (a ordem local é a do array);
 * - o backend exige URLs `http(s)://`: valores digitados sem esquema
 *   ("linkedin.com/in/fulano") recebem `https://` ao salvar;
 * - trabalho atual não pode ter data de término no backend.
 */
import type {
  ApiLanguage,
  ApiProficiency,
  ApiProject,
  ApiResume,
  ApiResumeData,
  ApiResumeSummary,
  ApiSkill,
} from '@/lib/api/resumes'
import type {
  LanguageProficiency,
  Resume,
  ResumeContent,
  ResumeProject,
  ResumeSkill,
  ResumeSummary,
} from './types'

const PROFICIENCY_FROM_API: Record<ApiProficiency, LanguageProficiency> = {
  beginner: 'Básico',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  fluent: 'Fluente',
  native: 'Nativo',
}

const PROFICIENCY_TO_API: Record<LanguageProficiency, ApiProficiency> = {
  Básico: 'beginner',
  Intermediário: 'intermediate',
  Avançado: 'advanced',
  Fluente: 'fluent',
  Nativo: 'native',
}

/** Junta cidade e estado no campo único do editor. */
export function joinLocation(city: string, state: string): string {
  return [city.trim(), state.trim()].filter(Boolean).join(', ')
}

/** Separa "São Paulo, SP" em cidade e estado (pela última vírgula). */
export function splitLocation(location: string): { city: string; state: string } {
  const value = location.trim()
  const index = value.lastIndexOf(',')
  if (index === -1) return { city: value, state: '' }
  return { city: value.slice(0, index).trim(), state: value.slice(index + 1).trim() }
}

/** Acrescenta `https://` quando o valor não tem esquema; vazio continua vazio. */
export function withUrlScheme(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** true somente para URLs http/https bem formadas. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== ''
  } catch {
    return false
  }
}

/** Mantém a URL apenas se for http/https; qualquer outra coisa vira vazio. */
export function safeHttpUrl(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed && isHttpUrl(trimmed) ? trimmed : ''
}

/** Remove o esquema para exibição ("https://site.dev/" → "site.dev"). */
export function displayUrl(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function projectFromApi(item: ApiProject): ResumeProject {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    technologies: [...(item.technologies ?? [])],
    url: safeHttpUrl(item.url),
    repository: safeHttpUrl(item.repository),
  }
}

export function skillFromApi(item: ApiSkill): ResumeSkill {
  return { id: item.id, name: item.name }
}

function proficiencyFromApi(value: string): LanguageProficiency {
  return PROFICIENCY_FROM_API[value as ApiProficiency] ?? 'Intermediário'
}

export function summaryFromApi(item: ApiResumeSummary): ResumeSummary {
  return {
    id: item.id,
    name: item.name,
    kind: item.type,
    baseId: item.base_resume_id,
    revision: item.revision,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

export function resumeFromApi(item: ApiResume): Resume {
  const data = item.data
  return {
    ...summaryFromApi(item),
    personal: {
      fullName: data.personal.full_name,
      headline: data.personal.title,
      email: data.personal.email,
      phone: data.personal.phone,
      location: joinLocation(data.personal.city, data.personal.state),
      linkedin: data.personal.linkedin,
      github: data.personal.github,
      website: data.personal.website,
    },
    summary: data.summary,
    experiences: (data.experiences ?? []).map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      location: exp.location,
      startDate: exp.start_date,
      endDate: exp.end_date,
      current: exp.current,
      description: exp.description,
    })),
    education: (data.education ?? []).map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      course: edu.course,
      degree: edu.degree,
      startDate: edu.start_date,
      endDate: edu.end_date,
      description: edu.description,
    })),
    skills: (data.skills ?? []).map(skillFromApi),
    projects: (data.projects ?? []).map(projectFromApi),
    languages: (data.languages ?? []).map((lang: ApiLanguage) => ({
      id: lang.id,
      name: lang.language,
      proficiency: proficiencyFromApi(lang.proficiency),
    })),
  }
}

/**
 * Monta o `data` do PATCH com TODAS as seções do conteúdo. Como cada seção
 * enviada substitui a coleção inteira no servidor, o cliente sempre envia as
 * coleções completas (já mescladas com importações e edições locais).
 */
export function contentToApi(content: ResumeContent): ApiResumeData {
  const { city, state } = splitLocation(content.personal.location)

  return {
    personal: {
      full_name: content.personal.fullName,
      title: content.personal.headline,
      email: content.personal.email,
      phone: content.personal.phone,
      city,
      state,
      linkedin: withUrlScheme(content.personal.linkedin),
      github: withUrlScheme(content.personal.github),
      website: withUrlScheme(content.personal.website),
    },
    summary: content.summary,
    experiences: content.experiences.map((exp, index) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      location: exp.location,
      start_date: exp.startDate,
      end_date: exp.current ? '' : exp.endDate,
      current: exp.current,
      description: exp.description,
      display_order: index,
    })),
    education: content.education.map((edu, index) => ({
      id: edu.id,
      institution: edu.institution,
      course: edu.course,
      degree: edu.degree,
      start_date: edu.startDate,
      end_date: edu.endDate,
      description: edu.description,
      display_order: index,
    })),
    skills: content.skills.map((skill, index) => ({
      id: skill.id,
      name: skill.name,
      display_order: index,
    })),
    projects: content.projects.map((project, index) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      technologies: [...project.technologies],
      url: withUrlScheme(project.url),
      repository: withUrlScheme(project.repository),
      display_order: index,
    })),
    languages: content.languages.map((lang, index) => ({
      id: lang.id,
      language: lang.name,
      proficiency: PROFICIENCY_TO_API[lang.proficiency],
      display_order: index,
    })),
  }
}

/** Serialização estável do conteúdo, usada para detectar edições. */
export function contentFingerprint(content: ResumeContent): string {
  return JSON.stringify({
    personal: content.personal,
    summary: content.summary,
    experiences: content.experiences,
    education: content.education,
    skills: content.skills,
    projects: content.projects,
    languages: content.languages,
  })
}
