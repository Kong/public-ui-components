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

    // first time or switch tag: create a new undo boundary
    if (tag !== '*' && lastTag !== tag) {
      lastTag = tag
      baseCommit()
      notify('commit')
      return
    }

    // same tag: collapse. Commit first, then remove the last boundary
    baseCommit()
    if (undoStack.value.length > 1) {
      undoStack.value.splice(1, 1)
    } else if (tag === '*' && undoStack.value.length === 1) {
      // If `tag` is "*" and only one history checkpoint is present,
      // remove it as we don't have other checkpoints to collapse into.
      undoStack.value.splice(0, 1)
    }
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
