/**
 * Estado do workspace de currículos.
 *
 * O store é a única fonte de verdade para o currículo-base, as versões e a
 * seleção atual. A persistência é simulada no localStorage pela camada
 * `lib/resume/storage.ts`, sempre com um pequeno debounce para imitar o
 * comportamento de salvamento de um editor real.
 *
 * Regras importantes:
 * - o currículo-base nunca é removido nem renomeado por ações de versão;
 * - criar uma versão copia os dados ATUAIS do base e gera ids novos;
 * - alterações em uma versão nunca tocam no base ou em outras versões.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createInitialWorkspace, createVersionFrom } from '@/lib/resume/factory'
import { createId } from '@/lib/resume/id'
import { RESUME_SCHEMA_VERSION, loadWorkspace, saveWorkspace } from '@/lib/resume/storage'
import type {
  Resume,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
} from '@/lib/resume/types'

const SAVE_DELAY_MS = 450

export type SaveStatus = 'saved' | 'saving' | 'error'

export const useResumesStore = defineStore('resumes', () => {
  const initial = createInitialWorkspace()

  const base = ref<Resume>(initial.base)
  const versions = ref<Resume[]>(initial.versions)
  const selectedId = ref(initial.selectedId)
  const saveStatus = ref<SaveStatus>('saved')
  const lastSavedAt = ref<string | null>(null)

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const allResumes = computed<Resume[]>(() => [base.value, ...versions.value])

  const selectedResume = computed<Resume>(
    () => allResumes.value.find((resume) => resume.id === selectedId.value) ?? base.value,
  )

  const isBaseSelected = computed(() => selectedResume.value.kind === 'base')
  const versionCount = computed(() => versions.value.length)

  /** Aplica um snapshot persistido; dados inválidos já foram descartados no storage. */
  function hydrate(): void {
    const snapshot = loadWorkspace()
    if (!snapshot) return

    base.value = snapshot.base
    versions.value = snapshot.versions
    selectedId.value = snapshot.selectedId
    lastSavedAt.value = snapshot.savedAt
  }

  hydrate()

  function persistNow(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    const savedAt = new Date().toISOString()
    const saved = saveWorkspace({
      schemaVersion: RESUME_SCHEMA_VERSION,
      base: base.value,
      versions: versions.value,
      selectedId: selectedId.value,
      savedAt,
    })

    saveStatus.value = saved ? 'saved' : 'error'
    if (saved) lastSavedAt.value = savedAt
  }

  function scheduleSave(): void {
    saveStatus.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      persistNow()
    }, SAVE_DELAY_MS)
  }

  /** Marca o currículo selecionado como alterado e agenda o salvamento local. */
  function touch(): void {
    selectedResume.value.updatedAt = new Date().toISOString()
    scheduleSave()
  }

  /** Força a gravação imediata (usado em testes e ao restaurar dados). */
  function flushSave(): void {
    persistNow()
  }

  function selectResume(id: string): void {
    if (!allResumes.value.some((resume) => resume.id === id)) return
    if (selectedId.value === id) return

    selectedId.value = id
    scheduleSave()
  }

  function createVersion(name: string): Resume | null {
    const trimmed = name.trim()
    if (!trimmed) return null

    const version = createVersionFrom(base.value, trimmed)
    versions.value.push(version)
    selectedId.value = version.id
    scheduleSave()
    return version
  }

  function renameVersion(id: string, name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) return false

    const version = versions.value.find((item) => item.id === id)
    if (!version) return false

    version.name = trimmed
    version.updatedAt = new Date().toISOString()
    scheduleSave()
    return true
  }

  function deleteVersion(id: string): boolean {
    const index = versions.value.findIndex((item) => item.id === id)
    if (index === -1) return false

    versions.value.splice(index, 1)
    if (selectedId.value === id) selectedId.value = base.value.id
    scheduleSave()
    return true
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
      period: '',
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
    base,
    versions,
    selectedId,
    saveStatus,
    lastSavedAt,
    allResumes,
    selectedResume,
    isBaseSelected,
    versionCount,
    touch,
    flushSave,
    selectResume,
    createVersion,
    renameVersion,
    deleteVersion,
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
