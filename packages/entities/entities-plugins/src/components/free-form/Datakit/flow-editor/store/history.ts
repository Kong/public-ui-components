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

  /**
   * Commit the current state to history.
   *
   * (By default) The current state (uncommitted changes NOT included) will be taken as a snapshot
   * and becomes a new undo boundary. A snapshot of the current state WITH uncommitted changes
   * at this moment will become the new "last" state, which will be used to reset the state on
   * calling `reset`.
   *
   * @param tag Tag to identify the last undo boundary. When provided, if the tag is identical to
   *            the last boundary's tag, or the tag is "*", the new boundary will replace the
   *            previous one, without creating a new undo boundary.
   */
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

    // tag is * or the previous one: only update 'last' in history, do not keep the new snapshot
    baseCommit()
    // remove the newly added snapshot
    undoStack.value.shift()

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
