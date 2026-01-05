import type { editor as Editor, IDisposable } from 'monaco-editor'

const MSG_PREFIX = '[monaco-editor] [lifecycle]'

type Scope
  = { type: 'editor', source: Editor.ICodeEditor }
  | { type: 'model', source: Editor.ITextModel }
type ScopeSource = Editor.ICodeEditor | Editor.ITextModel

interface ScopeData {
  disposables: Set<IDisposable>
  scopeListener: IDisposable
}

interface Tracked {
  decorated: IDisposable
  scope?: Scope
}

const scopedDisposables = new WeakMap<ScopeSource, ScopeData>()
const allDisposables = new Map<IDisposable, Tracked>() // [Original: Tracked]
const reversedLookup = new WeakMap<IDisposable, IDisposable>() // [Decorated: Original]

/**
 * Track a disposable in an optional scope.
 *
 * **WARNING**: Should not call {@link IDisposable.dispose dispose} on the
 *              disposable being passed in. Otherwise, the tracking will be broken.
 *
 * @param disposable - The disposable to track. When passing a decorated disposable,
 *                     the **SAME** decorated disposable will be **UPDATED** (if scope changes)
 *                     and returned. The previous scope will be no longer tracked.
 * @param scope - The scope of the disposable. When omitted, the disposable is
 *                tracked globally.
 *
 * @returns A decorated disposable to dispose the disposable and untrack it.
 */
function track(disposable: IDisposable, scope?: Scope): IDisposable {
  let original = disposable // Assume this is the non-decorated disposable
  let existing = allDisposables.get(original)

  if (!existing) {
    // `disposable` is new (from Monaco Editor) or previously decorated.
    // Try find the original disposable:
    const existingOriginal = reversedLookup.get(disposable)
    if (existingOriginal) {
      original = existingOriginal
      existing = allDisposables.get(existingOriginal)
    }
  }

  if (existing) {
    // Check if the scope is the same
    if (existing.scope?.type === scope?.type && existing.scope?.source === scope?.source)
      return existing.decorated

    detachFromScope(existing.decorated, existing.scope)
    if (scope) {
      attachToScope(existing.decorated, scope)
      existing.scope = scope
    } else {
      existing.scope = undefined
    }

    return existing.decorated
  }

  const originalDispose = original.dispose
  const decoratedDisposable = {
    dispose: () => {
      const tracked = allDisposables.get(original)
      if (tracked?.scope) {
        detachFromScope(decoratedDisposable, tracked.scope)
      }
      allDisposables.delete(original)
      reversedLookup.delete(decoratedDisposable)
      return originalDispose.call(original)
    },
  }

  allDisposables.set(original, { decorated: decoratedDisposable, scope })
  reversedLookup.set(decoratedDisposable, original)

  if (scope) {
    attachToScope(decoratedDisposable, scope)
  }

  return decoratedDisposable
}

function cleanupScope(source: ScopeSource) {
  const data = scopedDisposables.get(source)
  if (data) {
    data.scopeListener.dispose()
    scopedDisposables.delete(source)
  }
}

function ensureScopeData(scope: Scope): ScopeData {
  let scopeData = scopedDisposables.get(scope.source)

  if (!scopeData) {
    let listener: IDisposable
    switch (scope.type) {
      case 'editor': {
        listener = scope.source.onDidDispose(() => disposeScoped(scope.source))
        break
      }
      case 'model': {
        listener = scope.source.onWillDispose(() => disposeScoped(scope.source))
        break
      }
      default:
        throw new Error(`${MSG_PREFIX} Unknown scope: ${scope}`)
    }

    scopeData = {
      disposables: new Set(),
      scopeListener: listener,
    }
    scopedDisposables.set(scope.source, scopeData)
  }

  return scopeData
}

function attachToScope(disposable: IDisposable, scope: Scope) {
  const scopeData = ensureScopeData(scope)
  scopeData.disposables.add(disposable)
}

function detachFromScope(disposable: IDisposable, scope?: Scope) {
  if (!scope) return

  const scopeData = scopedDisposables.get(scope.source)
  if (!scopeData) return

  scopeData.disposables.delete(disposable)
  if (scopeData.disposables.size === 0) {
    cleanupScope(scope.source)
  }
}

function disposeMany(disposables: IDisposable[]) {
  const errors: unknown[] = []

  disposables.forEach((disposable) => {
    try {
      disposable.dispose()
    } catch (err) {
      errors.push(err)
    }
  })

  if (errors.length) {
    const aggregate = new AggregateError(
      errors, `${MSG_PREFIX} One or more disposables threw while being disposed.`,
    )
    console.error(aggregate)
    throw aggregate
  }
}

/**
 * Track a disposable for an {@link Editor.ICodeEditor editor}.
 *
 * The tracker uses {@link Editor.ICodeEditor.onDidDispose onDidDispose} to dispose
 * the tracked disposable.
 *
 * @param editor - The editor to track
 * @param disposable - The disposable to track
 * @returns A decorated disposable to dispose the disposable and untrack it.
 */
function trackForEditor(editor: Editor.ICodeEditor, disposable: IDisposable): IDisposable {
  return track(disposable, { type: 'editor', source: editor })
}

/**
 * Track a disposable for a {@link Editor.ITextModel text model}.
 *
 * The tracker uses {@link Editor.ITextModel.onWillDispose onWillDispose} to dispose
 * the tracked disposable.
 *
 * @param model - The text model to track
 * @param disposable - The disposable to track
 * @returns A decorated disposable to dispose the disposable and untrack it.
 */
function trackForModel(model: Editor.ITextModel, disposable: IDisposable): IDisposable {
  return track(disposable, { type: 'model', source: model })
}

/**
 * Dispose all tracked disposables in a scope.
 *
 * @param source - The scope source whose tracked disposables to dispose.
 */
function disposeScoped(source: ScopeSource) {
  const data = scopedDisposables.get(source)
  if (!data) return

  const toDispose = Array.from(data.disposables)
  disposeMany(toDispose)
  cleanupScope(source)
}

/**
 * Dispose all tracked disposables.
 */
function disposeAll() {
  const toDispose = Array.from(allDisposables.values())
  disposeMany(toDispose.map(t => t.decorated))
  allDisposables.clear()
}

// Prefer named exports for easier importing and autocompletion
export const lifecycle = {
  track,
  trackForEditor,
  trackForModel,
  disposeScoped,
  disposeAll,
} as const
