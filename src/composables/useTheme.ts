/**
 * Preferência de tema (sistema, claro ou escuro).
 *
 * - `system` remove `data-theme` do <html> e deixa o CSS seguir
 *   `prefers-color-scheme`; `light`/`dark` forçam o tema via `data-theme`.
 * - A escolha fica no `localStorage` (preferência de interface, não é dado
 *   sensível). Leitura e escrita são protegidas: em modo privado ou com
 *   armazenamento bloqueado, o tema apenas não persiste.
 * - O script inline em `index.html` aplica a preferência salva antes da
 *   primeira pintura, evitando o "flash" do tema errado. Mantenha a chave
 *   `THEME_STORAGE_KEY` em sincronia com ele.
 */
import { ref } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'applya-theme'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function applyPreference(preference: ThemePreference): void {
  const root = document.documentElement
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
}

const preference = ref<ThemePreference>(readStoredPreference())

function setTheme(next: ThemePreference): void {
  preference.value = next
  applyPreference(next)

  try {
    if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Armazenamento indisponível: o tema vale só para esta sessão.
  }
}

const ORDER: ThemePreference[] = ['system', 'light', 'dark']

/** Alterna na ordem sistema → claro → escuro. */
function cycleTheme(): void {
  const index = ORDER.indexOf(preference.value)
  setTheme(ORDER[(index + 1) % ORDER.length] ?? 'system')
}

export function useTheme() {
  return { preference, setTheme, cycleTheme }
}
