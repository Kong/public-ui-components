import { useManualRefHistory } from '@vueuse/core'
import type { Ref } from 'vue'

type HistoryAction = 'commit' | 'undo' | 'redo' | 'clear' | 'reset'

export interface HistoryFlag {
  skipEmittingChange?: boolean
}

/** Minimal tagged history. Same tag + replace drops previous snapshot. */
export function useTaggedHistory<T>(
  stateRef: Ref<T>,
  options?: {
    capacity?: number
    clone?: (v: T) => T
    onHistoryChange?: (action: HistoryAction, snapshot: T, flag?: HistoryFlag) => void
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

  function notify(action: HistoryAction, flag?: HistoryFlag) {
    options?.onHistoryChange?.(action, stateRef.value, flag)
  }

  function commit(tag?: string, opts?: { replace?: boolean, flag?: HistoryFlag }) {
    const replace = !!opts?.replace
    if (replace && tag && lastTag === tag && undoStack.value.length > 0) {
      undoStack.value.pop()
    }
    baseCommit()
    lastTag = tag
    notify('commit', opts?.flag)
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
