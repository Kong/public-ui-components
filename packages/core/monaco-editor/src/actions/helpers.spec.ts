import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapAction } from './helpers'

function setupMonacoMock(text: string, selection: any) {
  const getValueInRange = vi.fn((range) => {
    const lines = text.split('\n')
    const line = lines[range.startLineNumber - 1]
    return line.slice(range.startColumn - 1, range.endColumn - 1)
  })

  const getLineContent = vi.fn((lineNumber: number) => {
    return text.split('\n')[lineNumber - 1]
  })

  const model = {
    getValueInRange,
    getLineContent,
  }

  const editor = {
    getSelection: vi.fn(() => selection),
    getModel: vi.fn(() => model),
    executeEdits: vi.fn(),
    setSelection: vi.fn(),
    setPosition: vi.fn(),
    focus: vi.fn(),
  }

  return {
    monaco: { editor: { value: editor } },
    editor,
    model,
  }
}

describe('createWrapAction', () => {
  const marker = '**'
  const actionName = 'bold'
  const wrapAction = createWrapAction(marker, actionName)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should wrap selected text', () => {
    const selection = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 5,
      isEmpty: () => false,
    }

    const { monaco, editor } = setupMonacoMock('bold', selection)

    wrapAction(monaco as any)

    expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
      expect.objectContaining({ text: '**bold**' }),
    ])

    expect(editor.setSelection).toHaveBeenCalled()
  })

  it('unwraps already wrapped selected text', () => {
    const selection = {
      startLineNumber: 1,
      startColumn: 3, // bold inside **bold**
      endLineNumber: 1,
      endColumn: 7,
      isEmpty: () => false,
    }

    const { monaco, editor } = setupMonacoMock('**bold**', selection)

    wrapAction(monaco as any)

    expect(editor.executeEdits).toHaveBeenCalledTimes(1)
    const edits = editor.executeEdits.mock.calls[0][1]

    // Should remove two markers
    expect(edits).toHaveLength(2)
    expect(editor.setSelection).toHaveBeenCalled()
  })

  it('inserts markers when cursor is not inside wrap', () => {
    const selection = {
      startLineNumber: 1,
      startColumn: 5,
      endLineNumber: 1,
      endColumn: 5,
      isEmpty: () => true,
    }

    const { monaco, editor } = setupMonacoMock('bold', selection)

    wrapAction(monaco as any)

    expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
      expect.objectContaining({ text: '****' }),
    ])

    expect(editor.setPosition).toHaveBeenCalledWith({
      lineNumber: 1,
      column: 7,
    })
  })

  it('unwraps when cursor is inside existing markers', () => {
    const selection = {
      startLineNumber: 1,
      startColumn: 5, // **bo|ld**
      endLineNumber: 1,
      endColumn: 5,
      isEmpty: () => true,
    }

    const { monaco, editor } = setupMonacoMock('**bold**', selection)

    wrapAction(monaco as any)

    expect(editor.executeEdits).toHaveBeenCalledTimes(1)
    const edits = editor.executeEdits.mock.calls[0][1]

    // Removing opening + closing markers
    expect(edits).toHaveLength(2)
    expect(editor.setPosition).toHaveBeenCalled()
  })
})
