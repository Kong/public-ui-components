import { expect, it, vi } from 'vitest'
import { editor, languages, type Position } from 'monaco-editor'
import { defineCelKind } from './catalog'
import { attachCelLanguage, CEL_LANGUAGE_ID } from './language'

vi.mock('monaco-editor', () => {
  const register = () => vi.fn(() => ({ dispose: vi.fn() }))

  return {
    editor: { registerCommand: register(), setModelLanguage: vi.fn() },
    languages: {
      register: vi.fn(),
      setLanguageConfiguration: register(),
      setMonarchTokensProvider: register(),
      registerCompletionItemProvider: register(),
      registerHoverProvider: register(),
      registerSignatureHelpProvider: register(),
      CompletionTriggerKind: { Invoke: 0, TriggerCharacter: 1 },
      CompletionItemKind: { Variable: 1, Function: 2, Field: 3, Value: 4 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    },
  }
})

function scriptedEditor(source: string) {
  const onWillDispose = vi.fn(() => ({ dispose: vi.fn() }))
  const model = {
    getValue: () => source,
    getLineContent: (line: number) => source.split('\n')[line - 1],
    getOffsetAt: (position: Position) => source.split('\n').slice(0, position.lineNumber - 1)
      .reduce((offset, line) => offset + line.length + 1, position.column - 1),
    getWordAtPosition: () => ({ endColumn: 4 }),
    onWillDispose,
  } as unknown as editor.ITextModel
  const trigger = vi.fn()
  const instance = { getModel: () => model, trigger } as unknown as editor.IStandaloneCodeEditor
  return { model, instance, trigger }
}

it('shares providers across models, replaces the current word, and targets the accepting editor', async () => {
  const first = scriptedEditor('true &&\nhas')
  const second = scriptedEditor('"""\nhas')
  const options = { kind: () => defineCelKind([]), formatSubject: () => '' }
  const one = attachCelLanguage(first.instance, options)
  const two = attachCelLanguage(second.instance, options)

  try {
    expect(languages.registerCompletionItemProvider).toHaveBeenCalledTimes(1)
    expect(editor.setModelLanguage).toHaveBeenCalledWith(second.model, CEL_LANGUAGE_ID)
    const [, provider] = vi.mocked(languages.registerCompletionItemProvider).mock.calls[0]
    const complete = (model: editor.ITextModel) => provider.provideCompletionItems(model,
      { lineNumber: 2, column: 3 } as Position,
      { triggerKind: languages.CompletionTriggerKind.Invoke },
      { isCancellationRequested: false, onCancellationRequested: vi.fn() },
    )
    const has = (await complete(first.model))?.suggestions.find(item => item.label === 'has')
    expect(has?.range).toEqual({ startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 4 })
    const [commandId, run] = vi.mocked(editor.registerCommand).mock.calls[0]
    expect(has?.command).toMatchObject({ id: commandId, arguments: [first.model] })
    run({ get: vi.fn() }, first.model)
    expect(first.trigger.mock.calls.map(([, action]) => action)).toEqual(['editor.action.triggerParameterHints', 'editor.action.triggerSuggest'])
    expect(second.trigger).not.toHaveBeenCalled()
    expect((await complete(second.model))?.suggestions).toEqual([])

    const registration = vi.mocked(languages.registerCompletionItemProvider).mock.results[0].value
    one.dispose()
    expect(registration.dispose).not.toHaveBeenCalled()
    expect((await complete(first.model))?.suggestions).toEqual([])
    two.dispose()
    expect(registration.dispose).toHaveBeenCalledTimes(1)
  } finally {
    one.dispose()
    two.dispose()
  }
})
