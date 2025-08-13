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

  function commit(tag?: string) {
    // commit without tag
    if (!tag) {
      lastTag = undefined
      baseCommit()
      return
    }

    // first time or switch tag: create a new undo boundary
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
