import { computed, ref, watch } from 'vue'
import '@kong/design-tokens/themes/electric-lime-day.css'
import '@kong/design-tokens/themes/electric-lime-day-high-contrast.css'
import '@kong/design-tokens/themes/electric-lime-night.css'
import '@kong/design-tokens/themes/electric-lime-night-high-contrast.css'
import { KONG_UI_SANDBOX_DEFAULT_THEME, KONG_UI_SANDBOX_THEME_STORAGE_KEY } from '../constants'
import type { SandboxTheme, SandboxThemeMode } from '../types'

function parseTheme(theme: SandboxTheme): { mode: SandboxThemeMode, highContrast: boolean } {
  return {
    mode: theme.includes('night') ? 'night' : 'day',
    highContrast: theme.endsWith('high-contrast'),
  }
}

function buildTheme(mode: SandboxThemeMode, highContrast: boolean): SandboxTheme {
  return highContrast ? `electric-lime-${mode}-high-contrast` : `electric-lime-${mode}`
}

const initial = parseTheme(
  (localStorage.getItem(KONG_UI_SANDBOX_THEME_STORAGE_KEY) as SandboxTheme | null) || KONG_UI_SANDBOX_DEFAULT_THEME,
)

// Module-level (not created inside `useSandboxTheme`) so every `SandboxThemePicker`
// instance in the page — e.g. the desktop sidebar copy and the mobile slideout copy —
// shares one reactive state instead of drifting out of sync with each other.
const mode = ref<SandboxThemeMode>(initial.mode)
const highContrast = ref<boolean>(initial.highContrast)

const theme = computed<SandboxTheme>(() => buildTheme(mode.value, highContrast.value))

watch(theme, (value) => {
  document.documentElement.setAttribute('data-kui-theme', value)
  localStorage.setItem(KONG_UI_SANDBOX_THEME_STORAGE_KEY, value)
}, { immediate: true })

export function useSandboxTheme() {
  return { theme, mode, highContrast }
}
