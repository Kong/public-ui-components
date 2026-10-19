import type { SandboxTheme, SandboxThemeFamily, SandboxThemeMode } from './types'

export const KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY = 'kong-ui-sandbox-layout-links'

/** `localStorage` key used to persist the sandbox theme across reloads. */
export const KONG_UI_SANDBOX_THEME_STORAGE_KEY = 'kong-ui-sandbox-theme'

/** Every sandbox defaults to this theme unless the user picked a different one. */
export const KONG_UI_SANDBOX_DEFAULT_THEME: SandboxTheme = 'mono-lime-day'

export const KONG_UI_SANDBOX_THEME_FAMILY_OPTIONS: Array<{ label: string, value: SandboxThemeFamily }> = [
  { label: 'Mono lime', value: 'mono-lime' },
  { label: 'Electric lime', value: 'electric-lime' },
]

export const KONG_UI_SANDBOX_THEME_MODE_OPTIONS: Array<{ label: string, value: SandboxThemeMode }> = [
  { label: 'Day', value: 'day' },
  { label: 'Night', value: 'night' },
]
