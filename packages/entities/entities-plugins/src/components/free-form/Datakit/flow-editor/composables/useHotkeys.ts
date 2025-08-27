import { onKeyDown } from '@vueuse/core'

interface UseHotkeysOptions {
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

  _isMac = /Mac|iPhone|iPod|iPad/i.test(navigator?.platform) || /macOS|Mac|iPhone|iPod|iPad/i.test((navigator as any)?.userAgentData?.platform)
  return _isMac
}

function isInput(el: HTMLElement) {
  return el.closest('input, textarea, [contenteditable]:not([contenteditable="false"])') != null
}

export function useHotkeys({ undo, redo, cut, copy, paste }: UseHotkeysOptions) {
  const mac = isMac()

  if (undo || redo) {
    onKeyDown('z', (event) => {
      if (isInput(event.target as HTMLElement)) return

      if (undo && (mac ? event.metaKey : event.ctrlKey) && !event.shiftKey) {
        event.preventDefault()
        undo()
      }

      if (redo && (mac ? event.metaKey : event.ctrlKey) && event.shiftKey) {
        event.preventDefault()
        redo()
      }
    })
  }

  if (redo) {
    onKeyDown('y', (event) => {
      if (isInput(event.target as HTMLElement)) return

      if (mac ? event.metaKey : event.ctrlKey) {
        event.preventDefault()
        redo()
      }
    })
  }

  if (cut) {
    onKeyDown('x', (event) => {
      if (isInput(event.target as HTMLElement)) return

      if (mac ? event.metaKey : event.ctrlKey) {
        event.preventDefault()
        cut()
      }
    })
  }

  if (copy) {
    onKeyDown('c', (event) => {
      if (isInput(event.target as HTMLElement)) return

      if (mac ? event.metaKey : event.ctrlKey) {
        event.preventDefault()
        copy()
      }
    })
  }

  if (paste) {
    onKeyDown('v', (event) => {
      if (isInput(event.target as HTMLElement)) return

      if (mac ? event.metaKey : event.ctrlKey) {
        event.preventDefault()
        paste()
      }
    })
  }
}
