import { vi } from 'vitest'

export const Uri = {
  parse: vi.fn(() => ({ toString: () => 'mock://uri' })),
}

export const editor = {
  create: vi.fn(() => ({
    setValue: vi.fn(),
    getValue: vi.fn(() => 'mocked code'),
    onDidChangeModelContent: vi.fn(),
    updateOptions: vi.fn(),
    focus: vi.fn(),
    trigger: vi.fn(),
    dispose: vi.fn(),
    getModel: vi.fn(() => ({ uri: { toString: () => 'mock://model' }, dispose: vi.fn() })),
    getContribution: vi.fn(() => ({
      getState: vi.fn(() => ({
        isRevealed: false,
        onFindReplaceStateChange: vi.fn(),
      })),
      closeFindWidget: vi.fn(),
    })),
  })),
  remeasureFonts: vi.fn(),
  createModel: vi.fn(() => ({})),
}

export const languages = {
  getLanguages: vi.fn(() => [{ id: 'javascript' }]),
  register: vi.fn(),
}

export default {
  Uri,
  editor,
  languages,
}
