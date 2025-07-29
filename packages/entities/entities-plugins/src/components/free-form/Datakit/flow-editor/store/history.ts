import { useManualRefHistory } from '@vueuse/core'
import type { Ref } from 'vue'

/** Minimal tagged history. Same tag + replace drops previous snapshot. */
export function useTaggedHistory<T>(
  stateRef: Ref<T>,
  options?: { capacity?: number, clone?: (v: T) => T },
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

  function commit(tag?: string, opts?: { replace?: boolean }) {
    const replace = !!opts?.replace
    if (replace && tag && lastTag === tag && undoStack.value.length > 0) {
      undoStack.value.pop()
    }
    baseCommit()
    lastTag = tag
  }

  function undo() {
    baseUndo()
    lastTag = undefined
  }
  function redo() {
    baseRedo()
    lastTag = undefined
  }
  function clear() {
    baseClear()
    lastTag = undefined
  }
  function reset() {
    baseReset()
    lastTag = undefined
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
