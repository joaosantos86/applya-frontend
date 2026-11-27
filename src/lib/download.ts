/**
 * Download de arquivos gerados pela API (ex.: PDF do currículo).
 * O blob vira uma URL temporária, liberada logo após o clique.
 */

/** "Marina Alves — Backend Go" → "marina-alves-backend-go". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Dá tempo ao navegador de iniciar o download antes de liberar a URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
