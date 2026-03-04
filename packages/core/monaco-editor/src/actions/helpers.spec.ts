import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapAction, createInsertAction } from './helpers'

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

describe('createInsertAction', () => {
  const makeSelection = (
    startColumn: number,
    endColumn: number,
    isEmpty = false,
  ) => ({
    startLineNumber: 1,
    startColumn,
    endLineNumber: 1,
    endColumn,
    isEmpty: () => isEmpty,
  })

  const setup = (
    text: string,
    selection: ReturnType<typeof makeSelection>,
  ) => {
    const { monaco, editor } = setupMonacoMock(text, selection)
    return { monaco: monaco as any, editor }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('link variant', () => {
    const prefix = '['
    const suffix = '](url)'
    const actionName = 'link'
    const placeholder = 'url'

    const insertAction = createInsertAction(
      prefix,
      suffix,
      actionName,
      placeholder,
    )

    describe('with selected text', () => {
      it('wraps selected text and selects url placeholder', () => {
        const selection = makeSelection(1, 6) // "hello"
        const { monaco, editor } = setup('hello', selection)

        insertAction(monaco)

        expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
          expect.objectContaining({ text: '[hello](url)' }),
        ])

        expect(editor.setSelection).toHaveBeenCalledWith({
          startLineNumber: 1,
          startColumn: 9,
          endLineNumber: 1,
          endColumn: 12,
        })
      })

      it('unwraps entire construct when label is selected', () => {
        const selection = makeSelection(2, 7) // "hello"
        const { monaco, editor } = setup('[hello](url)', selection)

        insertAction(monaco)

        expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
          expect.objectContaining({
            range: expect.objectContaining({
              startColumn: 1,
              endColumn: 13,
            }),
            text: '',
          }),
        ])

        expect(editor.setPosition).toHaveBeenCalledWith({
          lineNumber: 1,
          column: 1,
        })
      })

      it('unwraps entire construct when url is selected', () => {
        const selection = makeSelection(9, 12) // "url"
        const { monaco, editor } = setup('[hello](url)', selection)

        insertAction(monaco)

        expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
          expect.objectContaining({
            range: expect.objectContaining({
              startColumn: 1,
              endColumn: 13,
            }),
            text: 'hello',
          }),
        ])

        expect(editor.setSelection).toHaveBeenCalledWith({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 6,
        })
      })
    })

    describe('without selection (cursor only)', () => {
      it('inserts full construct and selects label placeholder', () => {
        const selection = makeSelection(1, 1, true)
        const { monaco, editor } = setup('', selection)

        insertAction(monaco)

        expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
          expect.objectContaining({ text: '[link](url)' }),
        ])

        expect(editor.setSelection).toHaveBeenCalledWith({
          startLineNumber: 1,
          startColumn: 2,
          endLineNumber: 1,
          endColumn: 6,
        })
      })

      it('removes construct when placeholder label is selected (toggle off)', () => {
        const selection = makeSelection(2, 6) // "link"
        const { monaco, editor } = setup('[link](url)', selection)

        insertAction(monaco)

        expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
          expect.objectContaining({
            range: expect.objectContaining({
              startColumn: 1,
              endColumn: 12,
            }),
            text: '',
          }),
        ])

        expect(editor.setPosition).toHaveBeenCalledWith({
          lineNumber: 1,
          column: 1,
        })
      })
    })
  })

  describe('image variant', () => {
    const prefix = '!['
    const suffix = '](url)'
    const actionName = 'image'
    const placeholder = 'url'

    const imageAction = createInsertAction(
      prefix,
      suffix,
      actionName,
      placeholder,
    )

    it('wraps selected text as image and selects url', () => {
      const selection = makeSelection(1, 4) // "alt"
      const { monaco, editor } = setup('alt', selection)

      imageAction(monaco)

      expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
        expect.objectContaining({ text: '![alt](url)' }),
      ])

      expect(editor.setSelection).toHaveBeenCalledWith({
        startLineNumber: 1,
        startColumn: 8,
        endLineNumber: 1,
        endColumn: 11,
      })
    })

    it('unwraps image construct when url is selected', () => {
      const selection = makeSelection(8, 11) // "url"
      const { monaco, editor } = setup('![alt](url)', selection)

      imageAction(monaco)

      expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
        expect.objectContaining({
          range: expect.objectContaining({
            startColumn: 1,
            endColumn: 12,
          }),
          text: 'alt',
        }),
      ])

      expect(editor.setSelection).toHaveBeenCalledWith({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 4,
      })
    })
  })
})
