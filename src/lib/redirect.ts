/**
 * Validação de caminhos de redirecionamento.
 *
 * O query param `?redirect=` do login é controlado pelo usuário; só aceitamos
 * caminhos internos simples para evitar open redirect.
 */
export function isInternalPath(path: unknown): path is string {
  return (
    typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
  )
}
