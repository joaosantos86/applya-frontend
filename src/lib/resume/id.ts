/** Gera identificadores locais únicos para currículos e seções. */
export function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.()
  if (random) return `${prefix}-${random}`

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export const BASE_RESUME_ID = 'resume-base'
