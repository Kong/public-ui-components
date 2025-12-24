import { vi } from 'vitest'

vi.mock('monaco-editor', () => {
  const Uri = {
    parse: vi.fn(() => ({ toString: () => 'mock://uri' })),
  }

  const createDisposable = () => vi.fn()

  const editor = {
    create: vi.fn(() => ({
      setValue: vi.fn(),
      getValue: vi.fn(() => 'mocked code'),
      onDidChangeModelContent: vi.fn(() => createDisposable()),
      onDidDispose: vi.fn(() => createDisposable()),
      updateOptions: vi.fn(),
      focus: vi.fn(),
      trigger: vi.fn(),
      dispose: vi.fn(),
      getModel: vi.fn(() => ({ uri: { toString: () => 'mock://model' }, dispose: vi.fn() })),
      getContribution: vi.fn(() => ({
        getState: vi.fn(() => ({
          isRevealed: false,
          onFindReplaceStateChange: vi.fn(() => createDisposable()),
        })),
        closeFindWidget: vi.fn(),
      })),
    })),
    remeasureFonts: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    createModel: vi.fn(() => ({})),
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

  return {
    Uri,
    editor,
    languages,
    json,
  }
})
