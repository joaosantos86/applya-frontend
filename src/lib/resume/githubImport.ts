/**
 * Regras puras da importação do GitHub (sem estado, sem HTTP).
 *
 * A prévia vem de `GET /api/v1/resumes/imports/github`; aqui ficam a
 * normalização do usuário digitado e a mesclagem dos itens escolhidos no
 * rascunho aberto. A mesclagem só ACRESCENTA itens: projetos e habilidades
 * que já existem no currículo (inclusive editados à mão) ficam intactos.
 */
import { createId } from './id'
import type { ResumeProject, ResumeSkill } from './types'

/** Remove espaços nas pontas e um `@` inicial. Vazio = consulta bloqueada. */
export function normalizeGitHubUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').trim()
}

/**
 * Sugere o usuário a partir do campo GitHub do currículo
 * ("https://github.com/fulano" ou "github.com/fulano" → "fulano").
 */
export function usernameFromGitHubField(value: string): string {
  const match = value.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/?$/i)
  return match?.[1] ?? ''
}

/** Parte fixa da URL do perfil; no editor o usuário digita só o restante. */
export const GITHUB_PROFILE_PREFIX = 'https://github.com/'

const GITHUB_PROFILE_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\//i

/** Usuário do GitHub: letras, números e hífens isolados, até 39 caracteres. */
const GITHUB_USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/

/** Parte editável do campo GitHub ("https://github.com/fulano" → "fulano"). */
export function githubUserFromProfile(value: string): string {
  return value.trim().replace(GITHUB_PROFILE_PATTERN, '').replace(/\/+$/, '')
}

/**
 * Monta a URL do perfil a partir do que foi digitado. Aceita "fulano",
 * "@fulano" ou a URL colada inteira; vazio continua vazio.
 */
export function githubProfileUrl(input: string): string {
  const user = githubUserFromProfile(normalizeGitHubUsername(input))
  return user ? `${GITHUB_PROFILE_PREFIX}${user}` : ''
}

export function isValidGitHubUsername(user: string): boolean {
  return GITHUB_USERNAME_PATTERN.test(user)
}

/** Chave de comparação de repositório: sem caixa, barra final ou `.git`. */
function repositoryKey(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
}

/** Chave de comparação de habilidade: sem espaços nas pontas e sem caixa. */
export function skillKey(name: string): string {
  return name.trim().toLowerCase()
}

/** true quando o projeto já está na lista (mesmo id ou mesmo repositório). */
export function hasProject(projects: readonly ResumeProject[], candidate: ResumeProject): boolean {
  const key = candidate.repository ? repositoryKey(candidate.repository) : ''
  return projects.some(
    (project) =>
      project.id === candidate.id ||
      (key !== '' && project.repository !== '' && repositoryKey(project.repository) === key),
  )
}

export function hasSkill(skills: readonly ResumeSkill[], candidate: ResumeSkill): boolean {
  const key = skillKey(candidate.name)
  return skills.some((skill) => skillKey(skill.name) === key)
}

/**
 * Acrescenta ao final os projetos que ainda não existem. A comparação usa
 * primeiro o id e depois a URL do repositório, quando houver. Itens
 * existentes não são tocados (preserva edições locais e a ordem atual).
 */
export function mergeProjects(
  current: readonly ResumeProject[],
  incoming: readonly ResumeProject[],
): { projects: ResumeProject[]; added: number } {
  const projects = [...current]
  let added = 0
  for (const project of incoming) {
    if (hasProject(projects, project)) continue
    projects.push({ ...project, technologies: [...project.technologies] })
    added++
  }
  return { projects, added }
}

/** Acrescenta ao final as habilidades novas (nome sem caixa/espaços extras). */
export function mergeSkills(
  current: readonly ResumeSkill[],
  incoming: readonly ResumeSkill[],
): { skills: ResumeSkill[]; added: number } {
  const skills = [...current]
  let added = 0
  for (const skill of incoming) {
    const name = skill.name.trim()
    if (!name || hasSkill(skills, skill)) continue
    // O id da sugestão pode coincidir com o de uma habilidade renomeada à
    // mão; ids precisam ser únicos na coleção, então gera outro.
    const id = skills.some((item) => item.id === skill.id) ? createId('skill') : skill.id
    skills.push({ id, name })
    added++
  }
  return { skills, added }
}
