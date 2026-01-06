/**
 * Lifecycle tracker for {@link IDisposable disposables} in Monaco Editor.
 *
 * In Monaco Editor, when attaching listeners in the global scope (e.g.,
 * {@link Editor.onDidCreateModel onDidCreateModel}) or in the per-resource scope
 * (e.g.,{@link Editor.ITextModel.onDidChangeContent onDidChangeContent}), an
 * {@link IDisposable disposable} is always returned to allow detaching the listener.
 *
 * However, per-resource-scoped disposables are not automatically disposed when
 * the resource is disposed. This can lead to memory leaks if the disposables are
 * not properly tracked and disposed.
 *
 * This tracker is designed to be a singleton to track disposables in all the scopes
 * mentioned above.
 */

import { editor, type editor as Editor, type IDisposable } from 'monaco-editor'

const MSG_PREFIX = '[monaco-editor] [lifecycle]'

/**
 * A type friendly representation of a scope.
 */
type Scope
  = { type: 'editor', source: Editor.ICodeEditor }
  | { type: 'model', source: Editor.ITextModel }

/**
 * The source (i.e., resource) instance of a scope.
 */
type ScopeSource = Editor.ICodeEditor | Editor.ITextModel

/**
 * Data for a scope that is being tracked.
 */
interface ScopeData {
  /**
   * Disposables being tracked for a scope.
   */
  disposables: Set<IDisposable>

  /**
   * The disposable of the listener who signals the disposal of the scope.
   * This allows the listener itself to also be safely disposed.
   */
  scopeListener: IDisposable
}

/**
 * A representation of a disposable being tracked.
 */
interface Tracked {
  /**
   * The decorated (returned by {@link track} and other track functions) disposable
   * to dispose the original disposable and untrack the decorated disposable itself.
   */
  decorated: IDisposable

  /**
   * The scope of the original disposable being tracked, if any.
   */
  scope?: Scope
}

const scopedDisposables = new WeakMap<ScopeSource, ScopeData>()
const allDisposables = new Map<IDisposable, Tracked>() // [Original: Tracked]

/**
 * A map to find the original disposable from a decorated disposable.
 *
 * This is helpful when checking if a decorated disposable has been provided to
 * {@link track}.
 */
const reversedLookup = new WeakMap<IDisposable, IDisposable>()

function ensureScopeData(scope: Scope): ScopeData {
  let scopeData = scopedDisposables.get(scope.source)

  if (!scopeData) {
    let listener: IDisposable
    switch (scope.type) {
      case 'editor':
        listener = scope.source.onDidDispose(() => disposeScoped(scope.source))
        break
      case 'model':
        listener = scope.source.onWillDispose(() => disposeScoped(scope.source))
        break
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

function cleanupScope(source: ScopeSource): void {
  const data = scopedDisposables.get(source)
  if (data) {
    data.scopeListener.dispose()
    scopedDisposables.delete(source)
  }
}

function attachToScope(disposable: IDisposable, scope: Scope): void {
  const scopeData = ensureScopeData(scope)
  scopeData.disposables.add(disposable)
}

function detachFromScope(disposable: IDisposable, scope: Scope): void {
  const scopeData = scopedDisposables.get(scope.source)
  if (!scopeData) return

  scopeData.disposables.delete(disposable)
  if (scopeData.disposables.size === 0) {
    cleanupScope(scope.source)
  }
}

/**
 * Dispose a list of {@link IDisposable disposables}.
 *
 * @throws {@link AggregateError}
 * Thrown if one or more disposables throw errors while being disposed.
 */
function disposeMany(disposables: IDisposable[]): void {
  const errors: unknown[] = []

  disposables.forEach((disposable) => {
    try {
      disposable.dispose()
    } catch (err) {
      errors.push(err)
    }
  })

  if (errors.length) {
    throw new AggregateError(
      errors, `${MSG_PREFIX} One or more disposables threw while being disposed.`,
    )
  }
}

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
export function track(disposable: IDisposable, scope?: Scope): IDisposable {
  let original = disposable // Assume `disposable` is not a decorated one (previously returned by this function)
  let existing = allDisposables.get(original) // Check if already being tracked

  if (!existing) {
    // `disposable` is not being tracked.
    // Check if `disposable` is a decorated one.
    const existingOriginal = reversedLookup.get(disposable)
    if (existingOriginal) {
      // If so, reuse the existing tracked entry without creating a new one.
      original = existingOriginal
      existing = allDisposables.get(existingOriginal)
    }
  }

  if (existing) {
    // Check if the scope is the same
    if (existing.scope?.type === scope?.type && existing.scope?.source === scope?.source)
      return existing.decorated

    if (existing.scope) {
      detachFromScope(existing.decorated, existing.scope)
    }

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
      if (!tracked) return // Idempotency

      if (tracked.scope) {
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
export function trackForEditor(editor: Editor.ICodeEditor, disposable: IDisposable): IDisposable {
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
export function trackForModel(model: Editor.ITextModel, disposable: IDisposable): IDisposable {
  return track(disposable, { type: 'model', source: model })
}

/**
 * Dispose all tracked disposables in a scope.
 *
 * @param source - The scope source whose tracked disposables to dispose.
 */
export function disposeScoped(source: ScopeSource): void {
  const data = scopedDisposables.get(source)
  if (!data) return

  const toDispose = Array.from(data.disposables)
  try {
    disposeMany(toDispose)
  } catch (e) {
    console.warn(`${MSG_PREFIX} Encountered errors while disposing scoped disposables:`, e, ', Source:', source)
  }
  cleanupScope(source)
}

/**
 * Dispose all tracked disposables.
 */
export function disposeAll(): void {
  const toDispose = Array.from(allDisposables.values())
  try {
    disposeMany(toDispose.map(t => t.decorated))
  } catch (e) {
    console.warn(`${MSG_PREFIX} Encountered errors while disposing all disposables:`, e)
  }
  allDisposables.clear()
}
