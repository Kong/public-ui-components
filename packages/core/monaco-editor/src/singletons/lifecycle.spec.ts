import { describe, expect, it, vi } from 'vitest'

import { lifecycle } from './lifecycle'

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
    const tracked = lifecycle.track(disposable)

    tracked.dispose()

    expect(disposable.dispose).toHaveBeenCalledTimes(1)
    expect(() => tracked.dispose()).not.toThrow()
    expect(disposable.dispose).toHaveBeenCalledTimes(2)
  })

  it('disposes scoped disposables when the editor scope disposes', () => {
    const { source, listenerDisposable } = mockEditorScope()

    const disposable1 = mockDisposable()
    const disposable2 = mockDisposable()

    lifecycle.trackForEditor(source as editor.ICodeEditor, disposable1)
    lifecycle.trackForEditor(source as editor.ICodeEditor, disposable2)

    source.dispose()

    expect(disposable1.dispose).toHaveBeenCalledTimes(1)
    expect(disposable2.dispose).toHaveBeenCalledTimes(1)
    expect(listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('allows re-scoping the same disposable and cleans up the old scope', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const disposable = mockDisposable()

    lifecycle.trackForEditor(editorScope.source as editor.ICodeEditor, disposable)
    lifecycle.trackForModel(modelScope.source as editor.ITextModel, disposable)

    editorScope.source.dispose()
    expect(disposable.dispose).not.toHaveBeenCalled()
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)

    modelScope.source.dispose()
    expect(disposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('disposeScoped clears only that scope and leaves others intact', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const editorDisposable = mockDisposable()
    const modelDisposable = mockDisposable()

    lifecycle.trackForEditor(editorScope.source as editor.ICodeEditor, editorDisposable)
    lifecycle.trackForModel(modelScope.source as editor.ITextModel, modelDisposable)

    lifecycle.disposeScoped(editorScope.source as editor.ICodeEditor)

    expect(editorDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(editorScope.listenerDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(modelDisposable.dispose).not.toHaveBeenCalled()

    modelScope.source.dispose()
    expect(modelDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('disposeAll disposes everything and clears scope listeners', () => {
    const editorScope = mockEditorScope()
    const modelScope = mockModelScope()

    const globalDisposable = mockDisposable()
    const editorDisposable = mockDisposable()
    const modelDisposable = mockDisposable()

    lifecycle.track(globalDisposable)
    lifecycle.trackForEditor(editorScope.source as editor.ICodeEditor, editorDisposable)
    lifecycle.trackForModel(modelScope.source as editor.ITextModel, modelDisposable)
    lifecycle.disposeAll()

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

    lifecycle.track(simpleDisposable)
    lifecycle.track(disposableThatThrows)

    expect(() => lifecycle.disposeAll()).toThrow(AggregateError)
    expect(simpleDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(disposableThatThrows.dispose).toHaveBeenCalledTimes(1)
  })
})
