import { KeyCode, KeyMod } from 'monaco-editor'
import type { MonacoEditorActionConfig } from '../types'
import type { useMonacoEditor } from '../composables/useMonacoEditor'

const modifierMap: Record<string, number> = {
  command: KeyMod.CtrlCmd,
  cmd: KeyMod.CtrlCmd,
  ctrl: KeyMod.CtrlCmd,
  ctrlcmd: KeyMod.CtrlCmd,
  shift: KeyMod.Shift,
  alt: KeyMod.Alt,
  option: KeyMod.Alt,
  win: KeyMod.WinCtrl,
  meta: KeyMod.WinCtrl,
}

const specialKeyMap: Record<string, keyof typeof KeyCode> = {
  enter: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  space: 'Space',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  up: 'UpArrow',
  down: 'DownArrow',
  left: 'LeftArrow',
  right: 'RightArrow',
  arrowup: 'UpArrow',
  arrowdown: 'DownArrow',
  arrowleft: 'LeftArrow',
  arrowright: 'RightArrow',
}

/**
   * Parse string keybindings into Monaco KeyCode values
   * @param keys Array of key strings like ['Command', 'Shift', 'F']
   * @returns Monaco KeyCode combination or undefined
   */
export function parseKeybinding(keys: string[]): number | undefined {
  if (!keys?.length) return

  let modifiers: number = 0
  let keyCode: number | undefined

  for (const raw of keys) {
    const key = raw.toLowerCase()

    // Modifiers
    if (modifierMap[key]) {
      modifiers |= modifierMap[key]
      continue
    }

    // Function keys (F1–F12)
    if (/^f\d+$/.test(key)) {
      keyCode = KeyCode[`F${key.slice(1)}` as keyof typeof KeyCode]
      continue
    }

    // Letters
    if (/^[a-z]$/.test(key)) {
      keyCode = KeyCode[`Key${key.toUpperCase()}` as keyof typeof KeyCode]
      continue
    }

    // Digits
    if (/^\d$/.test(key)) {
      keyCode = KeyCode[`Digit${key}` as keyof typeof KeyCode]
      continue
    }

    // Special keys
    const mapped = specialKeyMap[key]
    if (mapped) {
      keyCode = KeyCode[mapped]
    }
  }

  return keyCode !== undefined ? modifiers | keyCode : undefined
}

/**
 * Execute a toolbar action based on its configuration
 * @param item The action configuration
 * @param editor The Monaco editor composable instance
 */
export function executeToolbarAction(
  item: MonacoEditorActionConfig,
  editor: ReturnType<typeof useMonacoEditor> | null,
): void {
  if (!editor) return

  if (typeof item.action === 'function') {
    item.action(editor)
  } else if (typeof item.action === 'string') {
    const actionId = item.action
    const monacoAction = editor.editor.value?.getAction(actionId)
    if (monacoAction) {
      monacoAction.run()
    } else {
      // Fallback to triggering as keyboard command
      editor.triggerKeyboardCommand(actionId)
    }
  }
}
