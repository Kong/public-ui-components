import type { editor as Editor, IDisposable } from 'monaco-editor'

type Scope
  = { type: 'editor', source: Editor.ICodeEditor }
  | { type: 'model', source: Editor.ITextModel }
type ScopeSource = Editor.ICodeEditor | Editor.ITextModel

let scopedDisposables = new WeakMap<ScopeSource, Set<IDisposable>>()
const allDisposables = new Map<IDisposable, IDisposable>()

/**
 * Track a disposable in the global scope.
 *
 * @param disposable The disposable to track
 */
function track(disposable: IDisposable, scope?: Scope): IDisposable {
  let decoratedDisposable = allDisposables.get(disposable)
  if (decoratedDisposable) {
    console.warn('[monaco-editor] [lifecycle] Disposable is already tracked:', disposable)
    return decoratedDisposable
  }

  const dispose = disposable.dispose
  decoratedDisposable = {
    ...disposable,
    dispose: () => {
      allDisposables.delete(disposable)
      return dispose.call(disposable)
    },
  }

  if (scope) {
    const dispose = decoratedDisposable.dispose
    decoratedDisposable.dispose = () => {
      const scoped = scopedDisposables.get(scope.source)
      if (scoped) {
        scoped.delete(decoratedDisposable!)
        if (scoped.size === 0) {
          scopedDisposables.delete(scope.source)
        }
      }
      return dispose()
    }

    const scoped = scopedDisposables.get(scope.source)
    if (!scoped) {
      scopedDisposables.set(scope.source, new Set([decoratedDisposable]))
      switch (scope.type) {
        case 'editor':
          scope.source.onDidDispose(() => disposeScoped(scope.source))
          break
        case 'model':
          scope.source.onWillDispose(() => disposeScoped(scope.source))
          break
      }
    } else {
      scoped.add(decoratedDisposable)
    }
  }

  allDisposables.set(disposable, decoratedDisposable)
  return decoratedDisposable
}

function trackForEditor(editor: Editor.ICodeEditor, disposable: IDisposable): IDisposable {
  return track(disposable, { type: 'editor', source: editor })
}

function trackForModel(model: Editor.ITextModel, disposable: IDisposable): IDisposable {
  return track(disposable, { type: 'model', source: model })
}

function disposeScoped(source: ScopeSource) {
  const scoped = scopedDisposables.get(source)
  if (!scoped) return

  scoped.forEach(d => d.dispose())
  scopedDisposables.delete(source)
}

/**
 * Dispose all tracked disposables.
 */
function disposeAll() {
  allDisposables.forEach(d => d.dispose())
  allDisposables.clear()
  scopedDisposables = new WeakMap<ScopeSource, Set<IDisposable>>()
}

export const lifecycle = {
  track,
  trackForEditor,
  trackForModel,
  disposeScoped,
  disposeAll,
} as const
