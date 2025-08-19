import { useManualRefHistory } from '@vueuse/core'
import type { Ref } from 'vue'

type HistoryAction = 'commit' | 'undo' | 'redo' | 'clear' | 'reset'

/** Minimal tagged history. Same tag + replace drops previous snapshot. */
export function useTaggedHistory<T>(
  stateRef: Ref<T>,
  options?: {
    capacity?: number
    clone?: (v: T) => T
    onHistoryChange?: (action: HistoryAction, snapshot: T) => void
  },
) {
  const {
    commit: baseCommit,
    undo: baseUndo,
    redo: baseRedo,
    canUndo,
    canRedo,
    clear: baseClear,
    reset: baseReset,
    undoStack,
  } = useManualRefHistory(stateRef, {
    capacity: options?.capacity ?? 200,
    clone: options?.clone,
  })

  let lastTag: string | undefined

  function notify(action: HistoryAction) {
    options?.onHistoryChange?.(action, stateRef.value)
  }


  function commit(tag?: string) {
    if (!tag) {
      lastTag = undefined
      baseCommit()
      notify('commit')
      return
    }

    if (lastTag !== tag) {
      lastTag = tag
      baseCommit()
      return
    }

    const keep = undoStack.value[0] ?? null

    // same tag: collapse. Commit first, then remove the last boundary
    baseCommit()
    undoStack.value.shift()

    // put old boundary back, compatible with capacity=1
    if (keep) undoStack.value.unshift(keep)
    notify('commit')
  }

  function undo() {
    baseUndo()
    lastTag = undefined
    notify('undo')
  }
  function redo() {
    baseRedo()
    lastTag = undefined
    notify('redo')
  }
  function clear() {
    baseClear()
    lastTag = undefined
    notify('clear')
  }
  function reset() {
    baseReset()
    lastTag = undefined
    notify('reset')
  }

  return {
    canUndo,
    canRedo,
    commit,
    undo,
    redo,
    clear,
    reset,
  }
}
