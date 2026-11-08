import { createId } from './id'
import { baseResume as mockBaseResume, versionSeeds } from './mock-data'
import type { Resume, ResumeWorkspaceData } from './types'

/** Conteúdo editável de um currículo (sem metadados de versão). */
export type ResumeContent = Pick<
  Resume,
  'personal' | 'summary' | 'experiences' | 'education' | 'skills' | 'projects' | 'languages'
>

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Copia o conteúdo de um currículo e gera novos ids para as seções. */
export function cloneResumeContent(source: Resume): ResumeContent {
  const content = clonePlain<ResumeContent>({
    personal: source.personal,
    summary: source.summary,
    experiences: source.experiences,
    education: source.education,
    skills: source.skills,
    projects: source.projects,
    languages: source.languages,
  })

  return {
    ...content,
    experiences: content.experiences.map((item) => ({ ...item, id: createId('exp') })),
    education: content.education.map((item) => ({ ...item, id: createId('edu') })),
    projects: content.projects.map((item) => ({ ...item, id: createId('project') })),
    languages: content.languages.map((item) => ({ ...item, id: createId('lang') })),
  }
}

/** Cria uma versão independente a partir dos dados atuais do currículo-base. */
export function createVersionFrom(base: Resume, name: string): Resume {
  const now = new Date().toISOString()

  return {
    ...cloneResumeContent(base),
    id: createId('version'),
    name: name.trim(),
    kind: 'version',
    baseId: base.id,
    createdAt: now,
    updatedAt: now,
  }
}

/** Monta o workspace inicial (base + versões de demonstração). */
export function createInitialWorkspace(): ResumeWorkspaceData {
  const base = clonePlain(mockBaseResume)

  const versions = versionSeeds.map((seed) => {
    const content = cloneResumeContent(base)
    const updatedAt = new Date()
    updatedAt.setDate(updatedAt.getDate() - seed.updatedDaysAgo)

    const createdAt = new Date(updatedAt)
    createdAt.setDate(createdAt.getDate() - 30)

    return {
      ...content,
      personal: { ...content.personal, headline: seed.headline },
      summary: seed.summary,
      skills: [...seed.skills],
      id: seed.id,
      name: seed.name,
      kind: 'version' as const,
      baseId: base.id,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }
  })

  return { base, versions, selectedId: base.id }
}
