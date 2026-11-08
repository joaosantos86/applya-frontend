import { describe, expect, it } from 'vitest'

import { routes } from '../routes'

describe('workspace route', () => {
  it('protects the workspace with authentication', () => {
    const workspace = routes.find((route) => route.name === 'workspace')

    expect(workspace?.path).toBe('/workspace')
    expect(workspace?.meta?.requiresAuth).toBe(true)
  })

  it('sends the old dashboard path to the workspace', () => {
    const dashboard = routes.find((route) => route.path === '/dashboard')

    expect(dashboard?.redirect).toEqual({ name: 'workspace' })
  })

  it('keeps the root path pointing at the workspace', () => {
    const root = routes.find((route) => route.path === '/')

    expect(root?.redirect).toEqual({ name: 'workspace' })
  })
})
