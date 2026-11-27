/**
 * Gera ids para itens novos das seções (experiências, projetos…). O backend
 * aceita ids `[A-Za-z0-9_-]{1,64}`: `prefixo-<uuid>` respeita o formato.
 */
export function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.()
  if (random) return `${prefix}-${random}`

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
