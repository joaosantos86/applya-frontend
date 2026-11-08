const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Formata `AAAA-MM` como "mar 2022". Valores vazios/inválidos são preservados. */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  const monthIndex = Number(month) - 1

  if (!year || !month || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value
  }

  return `${MONTHS[monthIndex] ?? ''} ${year}`
}

/** Período no formato "mar 2022 — atual". */
export function formatDateRange(startDate: string, endDate: string, current: boolean): string {
  const start = startDate ? formatMonth(startDate) : ''
  const end = current ? 'atual' : endDate ? formatMonth(endDate) : ''

  if (start && end) return `${start} — ${end}`
  return start || end
}

/** "Atualizado hoje, 14:32" / "Atualizado em 12 mar 2026". */
export function formatUpdatedAt(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isSameDay) {
    const time = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
    return `hoje, ${time}`
  }

  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
    .format(date)
    .replace('.', '')

  return `em ${day}`
}

/** Iniciais para avatares simples (ex.: "Lucas Ferreira" → "LF"). */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
