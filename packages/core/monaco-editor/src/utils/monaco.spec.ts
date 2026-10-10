import { describe, expect, it, vi } from 'vitest'
import * as monaco from 'monaco-editor'
import { createOrUpdateModel, getMonacoTheme } from './monaco'

describe('getMonacoTheme', () => {
  it('maps light to the light Shiki theme', () => {
    expect(getMonacoTheme('light')).toBe('catppuccin-latte')
  })

  it('maps dark to the dark Shiki theme', () => {
    expect(getMonacoTheme('dark')).toBe('material-theme-darker')
  })
})

describe('createOrUpdateModel', () => {
  it('creates a new model when none exists, with a plain URI when no uriSegment is given', () => {
    const model = createOrUpdateModel(undefined, 'hello', 'yaml')

    expect(monaco.editor.createModel).toHaveBeenCalledWith('hello', 'yaml', expect.anything())
    const [, , uriArg] = vi.mocked(monaco.editor.createModel).mock.calls[0]
    expect(vi.mocked(monaco.Uri.parse).mock.calls[0][0]).toMatch(/^inmemory:\/\/model\/yaml-.+$/)
    expect(uriArg).toBeDefined()
    expect(model).toBeDefined()
  })

  it('includes the uriSegment in the URI when provided', () => {
    createOrUpdateModel(undefined, 'hello', 'yaml', 'diff-original')

    const [uriString] = vi.mocked(monaco.Uri.parse).mock.calls.at(-1)!
    expect(uriString).toContain('diff-original/yaml-')
  })

  it('generates distinct URIs on successive calls', () => {
    createOrUpdateModel(undefined, 'a', 'yaml', 'diff-original')
    createOrUpdateModel(undefined, 'b', 'yaml', 'diff-modified')

    const calls = vi.mocked(monaco.Uri.parse).mock.calls
    const [originalUri] = calls.at(-2)!
    const [modifiedUri] = calls.at(-1)!
    expect(originalUri).not.toBe(modifiedUri)
  })

  it('updates the existing model via setValue instead of creating a new one', () => {
    const existing = { setValue: vi.fn() } as unknown as monaco.editor.ITextModel

    vi.mocked(monaco.editor.createModel).mockClear()
    const result = createOrUpdateModel(existing, 'new value', 'yaml')

    expect(existing.setValue).toHaveBeenCalledWith('new value')
    expect(monaco.editor.createModel).not.toHaveBeenCalled()
    expect(result).toBe(existing)
  })
})
