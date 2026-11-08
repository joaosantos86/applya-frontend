import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { RESUME_STORAGE_KEY } from '@/lib/resume/storage'
import { baseResume } from '@/lib/resume/mock-data'
import { useResumesStore } from '../resumes'

describe('resumes store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the base resume selected and three demo versions', () => {
    const store = useResumesStore()

    expect(store.selectedResume.id).toBe(store.base.id)
    expect(store.isBaseSelected).toBe(true)
    expect(store.versionCount).toBe(3)
    expect(store.selectedResume.personal.fullName).toBe(baseResume.personal.fullName)
    expect(store.selectedResume.experiences.length).toBeGreaterThan(0)
  })

  it('creates a version as an independent copy of the current base data', () => {
    const store = useResumesStore()
    const version = store.createVersion('Versão personalizada')

    expect(version).not.toBeNull()
    expect(store.selectedResume.id).toBe(version?.id)
    expect(store.isBaseSelected).toBe(false)

    expect(store.selectedResume.personal.fullName).toBe(store.base.personal.fullName)
    expect(store.selectedResume.experiences.map((item) => item.company)).toEqual(
      store.base.experiences.map((item) => item.company),
    )
    expect(store.selectedResume.experiences[0]?.id).not.toBe(store.base.experiences[0]?.id)

    store.selectedResume.summary = 'Resumo exclusivo da versão'
    store.touch()

    expect(store.base.summary).not.toBe('Resumo exclusivo da versão')
  })

  it('editing one version does not change other versions', () => {
    const store = useResumesStore()
    const first = store.createVersion('Primeira')
    const firstId = first?.id ?? ''
    const second = store.createVersion('Segunda')
    const secondId = second?.id ?? ''

    store.selectedResume.summary = 'Somente a segunda'
    store.touch()

    const firstVersion = store.versions.find((item) => item.id === firstId)
    const secondVersion = store.versions.find((item) => item.id === secondId)

    expect(firstVersion?.summary).not.toBe('Somente a segunda')
    expect(secondVersion?.summary).toBe('Somente a segunda')
  })

  it('switching versions preserves edits in each one', () => {
    const store = useResumesStore()
    const first = store.createVersion('Primeira')
    const firstId = first?.id ?? ''
    const second = store.createVersion('Segunda')
    const secondId = second?.id ?? ''
    const originalSecondSummary = store.selectedResume.summary

    store.selectResume(firstId)
    store.selectedResume.summary = 'Resumo da primeira'
    store.touch()

    store.selectResume(secondId)
    expect(store.selectedResume.summary).toBe(originalSecondSummary)

    store.selectResume(firstId)
    expect(store.selectedResume.summary).toBe('Resumo da primeira')
  })

  it('persists edits and restores them after a reload', () => {
    const store = useResumesStore()
    store.selectedResume.personal.headline = 'Desenvolvedor Go'
    store.touch()
    store.flushSave()

    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toContain('Desenvolvedor Go')

    setActivePinia(createPinia())
    const reloaded = useResumesStore()

    expect(reloaded.selectedResume.personal.headline).toBe('Desenvolvedor Go')
    expect(reloaded.selectedResume.id).toBe(store.base.id)
  })

  it('renames a version and keeps the new name after reload', () => {
    const store = useResumesStore()
    const version = store.versions[0]
    if (!version) throw new Error('Versão de demonstração ausente')

    expect(store.renameVersion(version.id, 'Backend Sênior')).toBe(true)
    expect(store.versions[0]?.name).toBe('Backend Sênior')
    store.flushSave()

    setActivePinia(createPinia())
    const reloaded = useResumesStore()
    expect(reloaded.versions[0]?.name).toBe('Backend Sênior')
  })

  it('deletes versions without deleting the base resume', () => {
    const store = useResumesStore()
    const version = store.versions[0]
    if (!version) throw new Error('Versão de demonstração ausente')

    const baseId = store.base.id
    store.selectResume(version.id)
    expect(store.deleteVersion(version.id)).toBe(true)

    expect(store.selectedResume.id).toBe(baseId)
    expect(store.base.id).toBe(baseId)
    expect(store.deleteVersion(baseId)).toBe(false)
    expect(store.base.id).toBe(baseId)
  })

  it('falls back to the initial workspace when stored data is invalid', () => {
    localStorage.setItem(RESUME_STORAGE_KEY, '{invalid')

    const store = useResumesStore()

    expect(store.versionCount).toBe(3)
    expect(store.selectedResume.id).toBe(store.base.id)
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
  })
})
