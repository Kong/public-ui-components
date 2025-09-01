import type { MaybeRefOrGetter } from 'vue'

import { toValue } from 'vue'
import { useEventListener } from '@vueuse/core'
import { detectPlatform } from '../utils'

interface UseHotkeysOptions {
  enabled: MaybeRefOrGetter<boolean>
  undo?: () => void
  redo?: () => void
  cut?: () => void
  copy?: () => void
  paste?: () => void
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

  const platform = detectPlatform()

  return useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (!toValue(enabled)) return
    if (isEditable(event.target as HTMLElement)) return

    const key = event.key.toLowerCase()
    const mod = platform === 'mac' ? event.metaKey : event.ctrlKey
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
        if (platform === 'windows' && redo) {
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
