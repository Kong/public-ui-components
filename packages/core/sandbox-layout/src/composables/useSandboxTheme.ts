import { computed, effectScope, ref, watch } from 'vue'
import '@kong/design-tokens/themes/mono-lime-day.css'
import '@kong/design-tokens/themes/mono-lime-day-high-contrast.css'
import '@kong/design-tokens/themes/mono-lime-night.css'
import '@kong/design-tokens/themes/mono-lime-night-high-contrast.css'
import '@kong/design-tokens/themes/electric-lime-day.css'
import '@kong/design-tokens/themes/electric-lime-day-high-contrast.css'
import '@kong/design-tokens/themes/electric-lime-night.css'
import '@kong/design-tokens/themes/electric-lime-night-high-contrast.css'
import { KONG_UI_SANDBOX_DEFAULT_THEME, KONG_UI_SANDBOX_THEME_STORAGE_KEY } from '../constants'
import type { SandboxTheme, SandboxThemeFamily, SandboxThemeMode } from '../types'

function parseTheme(theme: SandboxTheme): { family: SandboxThemeFamily, mode: SandboxThemeMode, highContrast: boolean } {
  return {
    family: theme.startsWith('electric-lime') ? 'electric-lime' : 'mono-lime',
    mode: theme.includes('night') ? 'night' : 'day',
    highContrast: theme.endsWith('high-contrast'),
  }
}

function buildTheme(family: SandboxThemeFamily, mode: SandboxThemeMode, highContrast: boolean): SandboxTheme {
  return highContrast ? `${family}-${mode}-high-contrast` : `${family}-${mode}`
}

const initial = parseTheme(
  (localStorage.getItem(KONG_UI_SANDBOX_THEME_STORAGE_KEY) as SandboxTheme | null) || KONG_UI_SANDBOX_DEFAULT_THEME,
)

// Module-level (not created inside `useSandboxTheme`) so every `SandboxThemePicker`
// instance in the page — e.g. the desktop sidebar copy and the mobile slideout copy —
// shares one reactive state instead of drifting out of sync with each other.
const family = ref<SandboxThemeFamily>(initial.family)
const mode = ref<SandboxThemeMode>(initial.mode)
const highContrast = ref<boolean>(initial.highContrast)

const theme = computed<SandboxTheme>(() => buildTheme(family.value, mode.value, highContrast.value))

let themeApplied = false

/**
 * Start applying the theme to the document (and persisting it).
 *
 * Deliberately *not* run on module import: a sandbox that opts out of the theme
 * picker must keep the un-themed look it had before the picker existed, and the
 * theme stylesheets only take effect once `data-kui-theme` is set.
 *
 * The watcher lives in a detached `effectScope` so it survives the unmount of
 * whichever component happened to trigger it first (e.g. the mobile slideout picker).
 */
function applySandboxTheme(): void {
  if (themeApplied) {
    return
  }

  themeApplied = true

  effectScope(true).run(() => {
    watch(theme, (value) => {
      document.documentElement.setAttribute('data-kui-theme', value)
      localStorage.setItem(KONG_UI_SANDBOX_THEME_STORAGE_KEY, value)
    }, { immediate: true })
  })
}

export function useSandboxTheme() {
  applySandboxTheme()

  return { theme, family, mode, highContrast }
}
