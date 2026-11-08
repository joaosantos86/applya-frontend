import { beforeEach, describe, expect, it } from 'vitest'

import { createInitialWorkspace } from '../factory'
import { RESUME_SCHEMA_VERSION, RESUME_STORAGE_KEY, loadWorkspace, saveWorkspace } from '../storage'
import type { ResumeWorkspaceSnapshot } from '../types'

function makeSnapshot(): ResumeWorkspaceSnapshot {
  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    ...createInitialWorkspace(),
    savedAt: new Date().toISOString(),
  }
}

describe('resume storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a complete workspace snapshot', () => {
    const snapshot = makeSnapshot()

    expect(saveWorkspace(snapshot)).toBe(true)
    expect(loadWorkspace()).toEqual(snapshot)
  })

  it('returns null when nothing was saved', () => {
    expect(loadWorkspace()).toBeNull()
  })

  it('discards invalid JSON and removes the corrupted entry', () => {
    localStorage.setItem(RESUME_STORAGE_KEY, '{not-json')

    expect(loadWorkspace()).toBeNull()
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
  })

  it('discards snapshots with an unsupported schema version', () => {
    const snapshot = makeSnapshot()
    localStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify({ ...snapshot, schemaVersion: RESUME_SCHEMA_VERSION + 1 }),
    )

    expect(loadWorkspace()).toBeNull()
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
  })

  it('discards snapshots with missing or malformed resume data', () => {
    const snapshot = makeSnapshot()
    const malformed = {
      ...snapshot,
      base: { ...snapshot.base, personal: { fullName: 'Incompleto' } },
    }

    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(malformed))

    expect(loadWorkspace()).toBeNull()
  })

  it('discards snapshots whose selected resume no longer exists', () => {
    const snapshot = makeSnapshot()
    localStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify({ ...snapshot, selectedId: 'versao-inexistente' }),
    )

    expect(loadWorkspace()).toBeNull()
  })
})
