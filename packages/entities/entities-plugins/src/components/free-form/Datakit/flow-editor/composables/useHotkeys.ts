import { toValue, type MaybeRefOrGetter } from 'vue'

import { onKeyDown, useEventListener } from '@vueuse/core'

interface UseHotkeysOptions {
  enabled: MaybeRefOrGetter<boolean>
  undo?: () => void
  redo?: () => void
  cut?: () => void
  copy?: () => void
  paste?: () => void
}

let _isMac: boolean | null = null
function isMac() {
  if (_isMac != null) return _isMac

  if (typeof navigator === 'undefined') {
    return false
  }

  _isMac =
    /Mac|iPhone|iPod|iPad/i.test(navigator?.platform) ||
    /macOS|Mac|iPhone|iPod|iPad/i.test(
      (navigator as any)?.userAgentData?.platform,
    )
  return _isMac
}

function isEditable(el: HTMLElement) {
  return (
    el.closest(
      'input, textarea, [contenteditable]:not([contenteditable="false"])',
    ) != null
  )
}

export function useHotkeys({
  undo,
  redo,
  cut,
  copy,
  paste,
  enabled = true,
}: UseHotkeysOptions) {
  if (typeof window === 'undefined') return
  if (!undo && !redo && !cut && !copy && !paste) return

  const mac = isMac()

  return useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (!toValue(enabled)) return
    if (isEditable(event.target as HTMLElement)) return

    const key = event.key.toLowerCase()
    const mod = mac ? event.metaKey : event.ctrlKey
    if (!mod) return

    switch (key) {
      case 'z': {
        if (undo && !event.shiftKey) {
          event.preventDefault()
          undo()
          return
        }
        if (redo && event.shiftKey) {
          event.preventDefault()
          redo()
          return
        }
        break
      }
      case 'y': {
        // ⌘ + Y is redo on Windows
        if (!mac && redo) {
          event.preventDefault()
          redo()
          return
        }
        break
      }
      case 'x': {
        if (cut) {
          event.preventDefault()
          cut()
          return
        }
        break
      }
      case 'c': {
        if (copy) {
          event.preventDefault()
          copy()
          return
        }
        break
      }
      case 'v': {
        if (paste) {
          event.preventDefault()
          paste()
          return
        }
        break
      }
    }
  },
  { passive: false },
  )
}
