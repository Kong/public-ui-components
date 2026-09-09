import { vi } from 'vitest'

vi.mock('monaco-editor', () => {
  const Uri = {
    parse: vi.fn(() => ({ toString: () => 'mock://uri' })),
  }

  const createDisposable = () => vi.fn()

  const makeTextModelMock = () => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    getFullModelRange: vi.fn(() => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 })),
    dispose: vi.fn(),
    getLanguageId: vi.fn(() => 'javascript'),
    onDidChangeLanguage: vi.fn(() => createDisposable()),
    onDidChangeContent: vi.fn(() => createDisposable()),
    onWillDispose: vi.fn(() => createDisposable()),
    getLineCount: vi.fn(() => 1),
    uri: { toString: () => 'mock://model' },
  })

  const makeCodeEditorMock = () => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => 'mocked code'),
    onDidChangeModelContent: vi.fn(() => createDisposable()),
    onDidDispose: vi.fn(() => createDisposable()),
    updateOptions: vi.fn(),
    focus: vi.fn(),
    trigger: vi.fn(),
    dispose: vi.fn(),
    getModel: vi.fn(() => ({ uri: { toString: () => 'mock://model' }, dispose: vi.fn(), getLanguageId: vi.fn(() => 'javascript'), onDidChangeLanguage: vi.fn(() => createDisposable()) })),
    setModel: vi.fn(),
    addAction: vi.fn(() => createDisposable()),
    getContribution: vi.fn(() => ({
      getState: vi.fn(() => ({
        isRevealed: false,
        onFindReplaceStateChange: vi.fn(() => createDisposable()),
      })),
      closeFindWidget: vi.fn(),
    })),
    getContainerDomNode: vi.fn(() => document.createElement('div')),
    layout: vi.fn(),
  })

  const makeDiffEditorMock = () => {
    // Separate mock objects for the two sides, so per-side assertions don't cross-talk.
    const originalEditor = makeCodeEditorMock()
    const modifiedEditor = makeCodeEditorMock()

    return {
      getOriginalEditor: vi.fn(() => originalEditor),
      getModifiedEditor: vi.fn(() => modifiedEditor),
      setModel: vi.fn(),
      getModel: vi.fn(() => null),
      updateOptions: vi.fn(),
      onDidUpdateDiff: vi.fn(() => createDisposable()),
      onDidChangeModel: vi.fn(() => createDisposable()),
      onDidDispose: vi.fn(() => createDisposable()),
      getLineChanges: vi.fn(() => []),
      goToDiff: vi.fn(),
      revealFirstDiff: vi.fn(),
      layout: vi.fn(),
      focus: vi.fn(),
      dispose: vi.fn(),
      getContainerDomNode: vi.fn(() => document.createElement('div')),
      addAction: vi.fn(() => createDisposable()),
    }
  }

  const editor = {
    create: vi.fn(() => makeCodeEditorMock()),
    // A fresh mock (and fresh inner editors) per call, so a `v-if` toggle test can
    // distinguish the first creation from the second.
    createDiffEditor: vi.fn(() => makeDiffEditorMock()),
    remeasureFonts: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    setModelLanguage: vi.fn(),
    createModel: vi.fn(() => makeTextModelMock()),
  }

  const languages = {
    getLanguages: vi.fn(() => [{ id: 'javascript' }]),
    register: vi.fn(),
    setTokensProvider: vi.fn(),
  }

  const json = {
    jsonDefaults: {
      setModeConfiguration: vi.fn(),
    },
  }

  // Mock KeyCode enum
  const KeyCode = {
    KeyA: 31,
    KeyB: 32,
    KeyK: 40,
    KeyP: 41,
    Digit5: 15,
    F2: 61,
    Enter: 3,
    LeftArrow: 15,
  }

  // Mock KeyMod enum
  const KeyMod = {
    CtrlCmd: 1 << 11,
    Shift: 1 << 10,
    Alt: 1 << 9,
    WinCtrl: 1 << 8,
  }

  return {
    Uri,
    editor,
    languages,
    json,
    KeyCode,
    KeyMod,
  }
})
