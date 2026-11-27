/**
 * Estado do workspace de currículos, sincronizado com a API do Applya.
 *
 * - `load()` busca o workspace (currículo-base completo + resumo das
 *   versões). O conteúdo de cada versão é carregado sob demanda ao abri-la.
 * - Cada currículo aberto vira um RASCUNHO em memória (`drafts`). Editar o
 *   rascunho só o marca como alterado; nada vai para o servidor até `save()`.
 * - `save()` envia o conteúdo completo (`PATCH` substitui as coleções
 *   enviadas) com a `revision` conhecida. 409 = o currículo mudou em outro
 *   lugar: o rascunho é preservado e o usuário escolhe recarregar.
 * - "Salvo" só é marcado depois da resposta de sucesso do backend.
 * - Alterações em uma versão nunca tocam o currículo-base nem outras versões.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import * as resumesApi from '@/lib/api/resumes'
import { mergeProjects, mergeSkills } from '@/lib/resume/githubImport'
import { createId } from '@/lib/resume/id'
import {
  contentFingerprint,
  contentToApi,
  resumeFromApi,
  summaryFromApi,
} from '@/lib/resume/mapper'
import type {
  Resume,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
  ResumeSkill,
  ResumeSummary,
} from '@/lib/resume/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * - `clean`: igual ao que o servidor tem e nada foi salvo nesta sessão;
 * - `saved`: o backend confirmou o último salvamento;
 * - `dirty`: há alterações locais não salvas;
 * - `saving`: PATCH em andamento;
 * - `error`: o último salvamento falhou (o rascunho continua alterado);
 * - `conflict`: 409 — o currículo foi alterado em outro lugar.
 */
export type SaveStatus = 'clean' | 'saved' | 'dirty' | 'saving' | 'error' | 'conflict'

interface SaveState {
  status: SaveStatus
  error: string | null
  savedAt: string | null
}

/** Resultado de ações que o componente precisa comunicar ao usuário. */
export type ActionResult<T = void> = { ok: true; value: T } | { ok: false; error: string }

const CONFLICT_MESSAGE =
  'Este currículo foi alterado em outra aba ou dispositivo. Recarregue para ver a versão mais recente.'

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: getUserFacingMessage(error, fallback) }
}

export const useResumesStore = defineStore('resumes', () => {
  const loadStatus = ref<LoadStatus>('idle')
  const loadError = ref<string | null>(null)

  const baseId = ref<string | null>(null)
  /** Resumo de cada versão (nome, revisão, datas), na ordem da API. */
  const versions = ref<ResumeSummary[]>([])
  /** Currículos carregados por completo, indexados por id. */
  const drafts = ref<Record<string, Resume>>({})
  /** Impressão digital do conteúdo como o servidor tem (para o estado "alterado"). */
  const serverFingerprints = ref<Record<string, string>>({})
  const saveStates = ref<Record<string, SaveState>>({})
  const selectedId = ref<string | null>(null)
  /** Versão sendo carregada ao trocar de currículo. */
  const openingId = ref<string | null>(null)

  /** Descarta respostas de `load()` iniciadas antes da última chamada/reset. */
  let generation = 0

  const base = computed<Resume | null>(() =>
    baseId.value ? (drafts.value[baseId.value] ?? null) : null,
  )

  /**
   * Currículo aberto no editor. Só é lido depois de `loadStatus === 'ready'`,
   * quando o currículo-base já está carregado.
   */
  const selectedResume = computed<Resume>(
    () => (selectedId.value ? drafts.value[selectedId.value] : undefined) ?? (base.value as Resume),
  )

  const isBaseSelected = computed(() => selectedResume.value?.kind === 'base')
  const versionCount = computed(() => versions.value.length)

  function stateOf(id: string): SaveState {
    return saveStates.value[id] ?? { status: 'clean', error: null, savedAt: null }
  }

  const selectedSave = computed<SaveState>(() =>
    selectedId.value ? stateOf(selectedId.value) : stateOf(''),
  )
  const saveStatus = computed<SaveStatus>(() => selectedSave.value.status)
  const saveError = computed(() => selectedSave.value.error)
  const lastSavedAt = computed(() => selectedSave.value.savedAt)

  const hasUnsavedChanges = computed(() =>
    Object.values(saveStates.value).some((state) =>
      ['dirty', 'saving', 'error', 'conflict'].includes(state.status),
    ),
  )

  function setState(id: string, patch: Partial<SaveState>): void {
    saveStates.value = { ...saveStates.value, [id]: { ...stateOf(id), ...patch } }
  }

  /** Registra o currículo como recebido do servidor (rascunho limpo). */
  function adoptFromServer(resume: Resume): void {
    drafts.value = { ...drafts.value, [resume.id]: resume }
    serverFingerprints.value = {
      ...serverFingerprints.value,
      [resume.id]: contentFingerprint(resume),
    }
  }

  function upsertSummary(resume: ResumeSummary): void {
    if (resume.kind !== 'version') return
    const summary: ResumeSummary = {
      id: resume.id,
      name: resume.name,
      kind: resume.kind,
      baseId: resume.baseId,
      revision: resume.revision,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }
    const index = versions.value.findIndex((item) => item.id === resume.id)
    if (index === -1) versions.value = [...versions.value, summary]
    else versions.value = versions.value.map((item, i) => (i === index ? summary : item))
  }

  function reset(): void {
    generation++
    loadStatus.value = 'idle'
    loadError.value = null
    baseId.value = null
    versions.value = []
    drafts.value = {}
    serverFingerprints.value = {}
    saveStates.value = {}
    selectedId.value = null
    openingId.value = null
  }

  async function load(): Promise<void> {
    reset()
    const current = generation
    loadStatus.value = 'loading'

    try {
      const workspace = await resumesApi.fetchWorkspace()
      if (current !== generation) return

      const baseResume = resumeFromApi(workspace.base)
      adoptFromServer(baseResume)
      baseId.value = baseResume.id
      versions.value = workspace.versions.map(summaryFromApi)
      selectedId.value = baseResume.id
      loadStatus.value = 'ready'
    } catch (error) {
      if (current !== generation) return
      loadError.value = getUserFacingMessage(error, 'Não foi possível carregar seus currículos.')
      loadStatus.value = 'error'
    }
  }

  /** Marca o currículo aberto como alterado (chamado a cada edição). */
  function touch(): void {
    const id = selectedId.value
    const draft = id ? drafts.value[id] : undefined
    if (!id || !draft) return

    const state = stateOf(id)
    // Edições não apagam o aviso de conflito: só recarregar resolve.
    if (state.status === 'conflict' || state.status === 'saving') return

    const changed = contentFingerprint(draft) !== serverFingerprints.value[id]
    if (changed) setState(id, { status: 'dirty', error: null })
    else if (state.status === 'dirty' || state.status === 'error')
      setState(id, { status: 'clean', error: null })
  }

  /**
   * Salva o currículo aberto. Envia o conteúdo completo e a revisão atual.
   * Se o usuário editar durante o salvamento, as edições novas continuam no
   * rascunho (e ele continua marcado como alterado).
   */
  async function save(): Promise<ActionResult> {
    const id = selectedId.value
    const draft = id ? drafts.value[id] : undefined
    if (!id || !draft) return { ok: false, error: 'Nenhum currículo aberto.' }

    const state = stateOf(id)
    if (state.status === 'saving') return { ok: false, error: 'Salvamento em andamento.' }
    if (state.status === 'conflict') return { ok: false, error: CONFLICT_MESSAGE }

    const sentFingerprint = contentFingerprint(draft)
    const patch: resumesApi.ResumePatch = { data: contentToApi(draft), revision: draft.revision }
    setState(id, { status: 'saving', error: null })

    try {
      const response =
        draft.kind === 'base'
          ? await resumesApi.updateBase(patch)
          : await resumesApi.updateVersion(id, patch)
      const saved = resumeFromApi(response)
      const savedAt = new Date().toISOString()
      const currentDraft = drafts.value[id]

      if (!currentDraft || contentFingerprint(currentDraft) === sentFingerprint) {
        // Nada mudou durante o salvamento: adota a versão normalizada do servidor.
        adoptFromServer(saved)
        setState(id, { status: 'saved', error: null, savedAt })
      } else {
        // Houve edições durante o PATCH: mantém o rascunho, atualiza a revisão.
        currentDraft.revision = saved.revision
        currentDraft.updatedAt = saved.updatedAt
        serverFingerprints.value = { ...serverFingerprints.value, [id]: contentFingerprint(saved) }
        setState(id, { status: 'dirty', error: null, savedAt })
      }
      upsertSummary(saved)
      return { ok: true, value: undefined }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setState(id, { status: 'conflict', error: CONFLICT_MESSAGE })
        return { ok: false, error: CONFLICT_MESSAGE }
      }
      const message = getUserFacingMessage(error, 'Não foi possível salvar. Tente novamente.')
      setState(id, { status: 'error', error: message })
      return { ok: false, error: message }
    }
  }

  /** Descarta o rascunho do currículo aberto e busca a versão do servidor. */
  async function reloadSelected(): Promise<ActionResult> {
    const id = selectedId.value
    const draft = id ? drafts.value[id] : undefined
    if (!id || !draft) return { ok: false, error: 'Nenhum currículo aberto.' }

    try {
      const fresh = resumeFromApi(
        draft.kind === 'base' ? await resumesApi.fetchBase() : await resumesApi.fetchVersion(id),
      )
      adoptFromServer(fresh)
      upsertSummary(fresh)
      setState(id, { status: 'clean', error: null })
      return { ok: true, value: undefined }
    } catch (error) {
      return fail(error, 'Não foi possível recarregar o currículo.')
    }
  }

  async function selectResume(id: string): Promise<ActionResult> {
    if (id === selectedId.value) return { ok: true, value: undefined }
    if (drafts.value[id]) {
      selectedId.value = id
      return { ok: true, value: undefined }
    }
    if (!versions.value.some((item) => item.id === id)) {
      return { ok: false, error: 'Currículo não encontrado.' }
    }

    openingId.value = id
    try {
      const resume = resumeFromApi(await resumesApi.fetchVersion(id))
      adoptFromServer(resume)
      upsertSummary(resume)
      // Só troca se o usuário não pediu outro currículo enquanto carregava.
      if (openingId.value === id) selectedId.value = id
      return { ok: true, value: undefined }
    } catch (error) {
      return fail(error, 'Não foi possível abrir esta versão.')
    } finally {
      if (openingId.value === id) openingId.value = null
    }
  }

  /**
   * Cria uma versão no servidor. O backend copia o currículo-base SALVO,
   * então alterações pendentes no base precisam ser salvas antes.
   */
  async function createVersion(name: string): Promise<ActionResult<Resume>> {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Informe um nome para a versão.' }
    if (
      baseId.value &&
      stateOf(baseId.value).status !== 'clean' &&
      stateOf(baseId.value).status !== 'saved'
    ) {
      return {
        ok: false,
        error: 'Salve as alterações do currículo-base antes de criar uma versão a partir dele.',
      }
    }

    try {
      const version = resumeFromApi(await resumesApi.createVersion(trimmed))
      adoptFromServer(version)
      upsertSummary(version)
      selectedId.value = version.id
      return { ok: true, value: version }
    } catch (error) {
      return fail(error, 'Não foi possível criar a versão.')
    }
  }

  async function renameVersion(id: string, name: string): Promise<ActionResult> {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Informe um nome para a versão.' }
    const summary = versions.value.find((item) => item.id === id)
    if (!summary) return { ok: false, error: 'Versão não encontrada.' }

    const draft = drafts.value[id]
    try {
      const updated = resumeFromApi(
        await resumesApi.updateVersion(id, {
          name: trimmed,
          revision: draft?.revision ?? summary.revision,
        }),
      )
      upsertSummary(updated)
      if (draft) {
        // Mantém o conteúdo do rascunho; só nome e revisão vêm do servidor.
        draft.name = updated.name
        draft.revision = updated.revision
        draft.updatedAt = updated.updatedAt
      }
      return { ok: true, value: undefined }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return { ok: false, error: CONFLICT_MESSAGE }
      }
      return fail(error, 'Não foi possível renomear a versão.')
    }
  }

  async function deleteVersion(id: string): Promise<ActionResult> {
    try {
      await resumesApi.deleteVersion(id)
    } catch (error) {
      return fail(error, 'Não foi possível excluir a versão.')
    }

    versions.value = versions.value.filter((item) => item.id !== id)
    const { [id]: _removedDraft, ...restDrafts } = drafts.value
    drafts.value = restDrafts
    const { [id]: _removedState, ...restStates } = saveStates.value
    saveStates.value = restStates
    if (selectedId.value === id) selectedId.value = baseId.value
    return { ok: true, value: undefined }
  }

  /**
   * Gera o PDF do currículo aberto, como está no editor (inclui alterações
   * ainda não salvas). O backend aplica a mesma validação do salvamento.
   */
  async function exportPdf(): Promise<ActionResult<Blob>> {
    const draft = selectedResume.value
    if (!draft) return { ok: false, error: 'Nenhum currículo aberto.' }

    try {
      const blob = await resumesApi.exportResumePdf(contentToApi(draft))
      return { ok: true, value: blob }
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        return {
          ok: false,
          error: rateLimitMessage(error, 'Muitas exportações seguidas. Aguarde um pouco.'),
        }
      }
      return fail(error, 'Não foi possível gerar o PDF. Tente novamente.')
    }
  }

  /**
   * Mescla projetos e habilidades escolhidos na prévia do GitHub ao rascunho
   * aberto. Só acrescenta itens novos; nada é enviado ao servidor aqui.
   */
  function applyGitHubImport(
    projects: readonly ResumeProject[],
    skills: readonly ResumeSkill[],
  ): { projects: number; skills: number } {
    const draft = selectedResume.value
    const projectResult = mergeProjects(draft.projects, projects)
    const skillResult = mergeSkills(draft.skills, skills)
    draft.projects = projectResult.projects
    draft.skills = skillResult.skills
    touch()
    return { projects: projectResult.added, skills: skillResult.added }
  }

  function addExperience(): ResumeExperience {
    const item: ResumeExperience = {
      id: createId('exp'),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
    selectedResume.value.experiences.push(item)
    touch()
    return item
  }

  function removeExperience(id: string): void {
    const items = selectedResume.value.experiences
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    items.splice(index, 1)
    touch()
  }

  function addEducation(): ResumeEducation {
    const item: ResumeEducation = {
      id: createId('edu'),
      institution: '',
      course: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: '',
    }
    selectedResume.value.education.push(item)
    touch()
    return item
  }

  function removeEducation(id: string): void {
    const items = selectedResume.value.education
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    items.splice(index, 1)
    touch()
  }

  function addProject(): ResumeProject {
    const item: ResumeProject = {
      id: createId('project'),
      name: '',
      description: '',
      technologies: [],
      url: '',
      repository: '',
    }
    selectedResume.value.projects.push(item)
    touch()
    return item
  }

  function removeProject(id: string): void {
    const items = selectedResume.value.projects
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    items.splice(index, 1)
    touch()
  }

  function addLanguage(): ResumeLanguage {
    const item: ResumeLanguage = {
      id: createId('lang'),
      name: '',
      proficiency: 'Intermediário',
    }
    selectedResume.value.languages.push(item)
    touch()
    return item
  }

  function removeLanguage(id: string): void {
    const items = selectedResume.value.languages
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    items.splice(index, 1)
    touch()
  }

  return {
    loadStatus,
    loadError,
    base,
    versions,
    selectedId,
    openingId,
    selectedResume,
    isBaseSelected,
    versionCount,
    saveStatus,
    saveError,
    lastSavedAt,
    hasUnsavedChanges,
    load,
    reset,
    touch,
    save,
    reloadSelected,
    selectResume,
    createVersion,
    renameVersion,
    deleteVersion,
    exportPdf,
    applyGitHubImport,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addProject,
    removeProject,
    addLanguage,
    removeLanguage,
  }
})
