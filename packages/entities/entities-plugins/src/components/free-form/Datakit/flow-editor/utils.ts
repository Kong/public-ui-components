type Platform = 'mac' | 'windows' | 'linux'

let _platform: Platform | null = null

export function detectPlatform(): Platform {
  if (_platform) return _platform

  if (typeof navigator === 'undefined') {
    return (_platform = 'windows')
  }

  const p =
    (navigator as any).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent

  if (/Mac|iPhone|iPad|iPod/i.test(p)) return (_platform = 'mac')
  if (/Linux/i.test(p) && !/Android/i.test(p)) return (_platform = 'linux')
  // unknown, assume windows
  return (_platform = 'windows')
}

export type SpecialKey =
  | 'Shift'
  | 'Alt'
  | 'Ctrl'
  | 'Meta'
  | 'Mod'
  | 'Enter'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Tab'
  | 'Esc'
  | 'Space'
  | 'Delete'

export type Key = SpecialKey | string & {}

const MAC_KEY_MAP: Record<SpecialKey, string> = {
  Shift: '⇧',
  Alt: '⌥',
  Ctrl: '⌃',
  Meta: '⌘',
  Mod: '⌘',
  Enter: '↩',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Tab: '⇥',
  Esc: '⎋',
  Space: 'Space',
  Delete: '⌫',
}

const WIN_KEY_MAP: Record<SpecialKey, string> = {
  Shift: 'Shift',
  Alt: 'Alt',
  Ctrl: 'Ctrl',
  Meta: 'Win',
  Mod: 'Ctrl',
  Enter: 'Enter',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Tab: 'Tab',
  Esc: 'Esc',
  Space: 'Spacebar',
  Delete: 'Delete',
}

export const LINUX_KEY_MAP: Record<SpecialKey, string> = {
  Shift: 'Shift',
  Alt: 'Alt',
  Ctrl: 'Ctrl',
  Meta: 'Super',
  Mod: 'Ctrl',
  Enter: 'Enter',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Tab: 'Tab',
  Esc: 'Esc',
  Space: 'Space',
  Delete: 'Delete',
}

export type FormatOptions = {
  platform?: Platform
  joiner?: string
}

export type KeySpec = Key[] | { [K in Platform]: Key[] }

export function formatKeys(spec: KeySpec, opts: FormatOptions = {}): string {
  const platform = opts.platform ?? detectPlatform()
  const joiner = opts.joiner ?? (platform === 'mac' ? '' : ' + ')

  const map =
    platform === 'mac'
      ? MAC_KEY_MAP
      : platform === 'linux'
        ? LINUX_KEY_MAP
        : WIN_KEY_MAP

  const combination = Array.isArray(spec) ? spec : spec[platform]

  return combination
    .map((key) => (key in map ? map[key as SpecialKey] : key))
    .join(joiner)
}
