import type { MaybeRefOrGetter } from 'vue'
import { toValue, onScopeDispose, warn } from 'vue'
import { useEventListener, createSharedComposable } from '@vueuse/core'

const ACTIONS = ['undo', 'redo', 'duplicate', 'cut', 'copy', 'paste'] as const
type Action = typeof ACTIONS[number]

type Options = {
  enabled?: MaybeRefOrGetter<boolean>
  undo?: () => void
  redo?: () => void
  duplicate?: () => void
  cut?: () => void
  copy?: () => void
  paste?: () => void
}

type Subscriber = Required<Pick<Options, 'enabled'>> &
  Omit<Options, 'enabled'>

const noop = () => {}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return !!el.closest(
    'input, textarea, [contenteditable]:not([contenteditable="false"])',
  )
}

function getAction(e: KeyboardEvent): Action | undefined {
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return
  const key = e.key.toLowerCase()

  switch (key) {
    case 'z':
      return e.shiftKey ? 'redo' : 'undo'
    case 'y':
      return 'redo'
    case 'd':
      return 'duplicate'
    case 'x':
      return 'cut'
    case 'c':
      return 'copy'
    case 'v':
      return 'paste'
  }
}

const useHotkeysBus = createSharedComposable(() => {
  const subs = new Set<Subscriber>()

  useEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (isEditable(e.target)) return

      const action = getAction(e)
      if (!action) return

      for (const sub of subs) {
        if (!toValue(sub.enabled)) continue
        const fn = sub[action]
        if (fn) {
          if (e.defaultPrevented) {
            warn(`[useHotkeys] event for "${action}" was already defaultPrevented. Hotkey ignored.`)
            return
          }
          e.preventDefault()
          fn()
          return
        }
      }
    },
    { passive: false },
  )

  function subscribe(handlers: Options) {
    if (!ACTIONS.some((action) => typeof handlers[action] === 'function')) {
      return noop
    }

    const entry: Subscriber = {
      enabled: handlers.enabled ?? true,
      ...handlers,
    }
    subs.add(entry)
    return () => subs.delete(entry)
  }

  return { subscribe }
})

export function useHotkeys(options: Options = {}) {
  if (typeof window === 'undefined') return noop
  const unsubscribe = useHotkeysBus().subscribe(options)
  onScopeDispose(unsubscribe)
  return unsubscribe
}
