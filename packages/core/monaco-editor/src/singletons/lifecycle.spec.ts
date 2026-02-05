import { describe, expect, it, vi } from 'vitest'

import { disposeAllDisposables, disposeGlobalDisposables, disposeScopedDisposables, trackDisposable, trackDisposableForEditor, trackDisposableForModel } from './lifecycle'

import type { editor, IDisposable } from 'monaco-editor'

const mockDisposable = (): IDisposable => ({ dispose: vi.fn() })

const mockEditorScope = () => {
  const listeners: Array<() => void> = []
  const listenerDisposable = mockDisposable()

  const source = {
    onDidDispose(cb: () => void) {
      listeners.push(cb)
      return listenerDisposable
    },
    dispose() {
      listeners.forEach(cb => cb())
    },
  }

  return { source, listenerDisposable }
}

const mockModelScope = () => {
  const listeners: Array<() => void> = []
  const listenerDisposable = mockDisposable()

  const source = {
    onWillDispose(cb: () => void) {
      listeners.push(cb)
      return listenerDisposable
    },
    dispose() {
      listeners.forEach(cb => cb())
    },
  }

  return { source, listenerDisposable }
}

describe('lifecycle singleton', () => {
  it('disposes a globally tracked disposable and untracks it', () => {
    const disposable = mockDisposable()
    const tracked = trackDisposable(disposable)

    tracked.dispose()

    expect(disposable.dispose).toHaveBeenCalledTimes(1)
    expect(() => tracked.dispose()).not.toThrow()
    expect(disposable.dispose).toHaveBeenCalledTimes(1) // Idempotent
  })

  it('disposes scoped disposables when the editor scope disposes', () => {
    const { source, listenerDisposable } = mockEditorScope()

    const disposable1 = mockDisposable()
    const disposable2 = mockDisposable()

    trackDisposableForEditor(source as editor.ICodeEditor, disposable1)
    trackDisposableForEditor(source as editor.ICodeEditor, disposable2)

    source.dispose()

    expect(disposable1.dispose).toHaveBeenCalledTimes(1)
    expect(disposable2.dispose).toHaveBeenCalledTimes(1)
    expect(listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('allows re-scoping the same disposable and cleans up the old scope', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const disposable = mockDisposable()

    trackDisposableForEditor(editorScope.source as editor.ICodeEditor, disposable)
    trackDisposableForModel(modelScope.source as editor.ITextModel, disposable)

    editorScope.source.dispose()
    expect(disposable.dispose).not.toHaveBeenCalled()
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)

    modelScope.source.dispose()
    expect(disposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('re-scopes when tracking a decorated disposable into another scope', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const disposable = mockDisposable()

    const decorated = trackDisposableForEditor(editorScope.source as editor.ICodeEditor, disposable)
    const decoratedAgain = trackDisposableForModel(modelScope.source as editor.ITextModel, decorated)

    // Should reuse the decorated disposable without creating new ones
    expect(decoratedAgain).toBe(decorated)

    // Last tracking wins: No-op here
    editorScope.source.dispose()
    expect(disposable.dispose).not.toHaveBeenCalled()
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)

    // Last tracking wins
    modelScope.source.dispose()
    expect(disposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('disposes only scoped disposables with disposeScopedDisposables', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const editorDisposable = mockDisposable()
    const modelDisposable = mockDisposable()

    trackDisposableForEditor(editorScope.source as editor.ICodeEditor, editorDisposable)
    trackDisposableForModel(modelScope.source as editor.ITextModel, modelDisposable)

    disposeScopedDisposables(editorScope.source as editor.ICodeEditor)

    expect(editorDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelDisposable.dispose).not.toHaveBeenCalled()

    modelScope.source.dispose()
    expect(modelDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('disposes only global disposables with disposeGlobalDisposables', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const globalDisposable = mockDisposable()
    const editorDisposable = mockDisposable()
    const modelDisposable = mockDisposable()
    trackDisposable(globalDisposable)
    trackDisposableForEditor(editorScope.source as editor.ICodeEditor, editorDisposable)
    trackDisposableForModel(modelScope.source as editor.ITextModel, modelDisposable)

    disposeGlobalDisposables()
    expect(globalDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(editorDisposable.dispose).not.toHaveBeenCalled()
    expect(modelDisposable.dispose).not.toHaveBeenCalled()
  })

  it('disposes everything and clears scope listeners with disposeAllDisposables', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const globalDisposable = mockDisposable()
    const editorDisposable = mockDisposable()
    const modelDisposable = mockDisposable()

    trackDisposable(globalDisposable)
    trackDisposableForEditor(editorScope.source as editor.ICodeEditor, editorDisposable)
    trackDisposableForModel(modelScope.source as editor.ITextModel, modelDisposable)
    disposeAllDisposables()

    expect(globalDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(editorDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('continues disposing when one disposable throws and aggregates the error', () => {
    const simpleDisposable = mockDisposable()
    const disposableThatThrows: IDisposable = {
      dispose: vi.fn(() => {
        throw new Error('Expected error')
      }),
    }
    const disposableAfterThrow = mockDisposable() // Should also be disposed

    trackDisposable(simpleDisposable)
    trackDisposable(disposableThatThrows)
    trackDisposable(disposableAfterThrow)

    const consoleMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(() => disposeAllDisposables()).not.toThrow()
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringMatching('Encountered errors while disposing all disposables'),
      expect.any(AggregateError))
    expect(simpleDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(disposableThatThrows.dispose).toHaveBeenCalledTimes(1)
    expect(disposableAfterThrow.dispose).toHaveBeenCalledTimes(1)

    consoleMock.mockRestore()
  })
})
