import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapAction, createInsertAction, createLinePrefixAction, createCodeblockAction, createTableAction } from './helpers'

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

describe('createLinePrefixAction', () => {
  function setupLinePrefixMock(
    lines: string[],
    startLine: number,
    endLine: number,
  ) {
    const selection = {
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: lines[endLine - 1]?.length + 1,
    }

    const model = {
      getLineContent: vi.fn((lineNumber: number) => lines[lineNumber - 1] ?? ''),
    }

    const editor = {
      getSelection: vi.fn(() => selection),
      getModel: vi.fn(() => model),
      executeEdits: vi.fn(),
      focus: vi.fn(),
    }

    return { monaco: { editor: { value: editor } } as any, editor }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fixed string prefixes', () => {
    it.each([
      {
        name: 'unordered list',
        prefix: '- ',
        id: 'unorderedList',
        lines: ['hello'],
        expectedText: '- ',
      },
      {
        name: 'task list',
        prefix: '- [ ] ',
        id: 'taskList',
        lines: ['task'],
        expectedText: '- [ ] ',
      },
    ])('adds prefix for $name', ({ prefix, id, lines, expectedText }) => {
      const action = createLinePrefixAction(prefix, id)
      const { monaco, editor } = setupLinePrefixMock(lines, 1, 1)

      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(1)
      expect(edits[0].text).toBe(expectedText)
      expect(editor.focus).toHaveBeenCalled()
    })

    it('toggles off when all lines already have prefix', () => {
      const action = createLinePrefixAction('- ', 'unorderedList')
      const lines = ['- one', '- two']

      const { monaco, editor } = setupLinePrefixMock(lines, 1, 2)
      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(2)
      edits.forEach((edit: any) => expect(edit.text).toBe(''))
    })

    it('adds prefix only to missing lines when mixed', () => {
      const action = createLinePrefixAction('- ', 'unorderedList')
      const lines = ['- one', 'two', '- three']

      const { monaco, editor } = setupLinePrefixMock(lines, 1, 3)
      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(1)
      expect(edits[0].range.startLineNumber).toBe(2)
      expect(edits[0].text).toBe('- ')
    })
  })

  describe('dynamic ordered prefix', () => {
    const action = createLinePrefixAction(
      (i) => `${i}. `,
      'orderedList',
      /^\d+\.\s/,
    )

    it('adds numbered prefixes', () => {
      const lines = ['first', 'second', 'third']
      const { monaco, editor } = setupLinePrefixMock(lines, 1, 3)

      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(3)

      expect(edits[0].text).toBe('3. ')
      expect(edits[1].text).toBe('2. ')
      expect(edits[2].text).toBe('1. ')
    })

    it('removes prefixes when all lines have them (including multi-digit)', () => {
      const lines = ['10. ten', '11. eleven']
      const { monaco, editor } = setupLinePrefixMock(lines, 1, 2)

      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(2)
      edits.forEach((edit: any) => expect(edit.text).toBe(''))
    })

    it('adds prefix only to missing lines when mixed', () => {
      const lines = ['1. first', 'second', '3. third']
      const { monaco, editor } = setupLinePrefixMock(lines, 1, 3)

      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(1)
      expect(edits[0].range.startLineNumber).toBe(2)
      expect(edits[0].text).toBe('2. ')
    })
  })

  describe('edge cases', () => {
    const action = createLinePrefixAction('- ', 'unorderedList')

    it('does nothing when editor/selection/model are null', () => {
      action({ editor: { value: null } } as any)

      const editor = {
        getSelection: vi.fn(() => null),
        getModel: vi.fn(() => null),
        executeEdits: vi.fn(),
        focus: vi.fn(),
      }

      action({ editor: { value: editor } } as any)

      expect(editor.executeEdits).not.toHaveBeenCalled()
    })

    it('handles single-line selection', () => {
      const { monaco, editor } = setupLinePrefixMock(['hello'], 1, 1)

      action(monaco)

      const edits = editor.executeEdits.mock.calls[0][1]
      expect(edits).toHaveLength(1)
      expect(editor.focus).toHaveBeenCalled()
    })
  })
})

describe('createCodeblockAction', () => {
  const actionName = 'codeblock'
  const codeblockAction = createCodeblockAction(actionName)

  function setupCodeblockMock(lines: string[], selection: any) {
    const getValueInRange = vi.fn((range: any) => {
      const result: string[] = []
      for (let line = range.startLineNumber; line <= range.endLineNumber; line++) {
        const content = lines[line - 1] ?? ''
        const start = line === range.startLineNumber ? range.startColumn - 1 : 0
        const end = line === range.endLineNumber ? range.endColumn - 1 : content.length
        result.push(content.slice(start, end))
      }
      return result.join('\n')
    })

    const model = {
      getValueInRange,
      getLineContent: vi.fn((ln: number) => lines[ln - 1] ?? ''),
      getLineCount: vi.fn(() => lines.length),
    }

    const editor = {
      getSelection: vi.fn(() => selection),
      getModel: vi.fn(() => model),
      executeEdits: vi.fn(),
      setSelection: vi.fn(),
      setPosition: vi.fn(),
      focus: vi.fn(),
    }

    return { monaco: { editor: { value: editor } } as any, editor }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    {
      name: 'inserts fenced block at empty line',
      lines: [''],
      selection: {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        isEmpty: () => true,
      },
      expectedText: '```markdown\n\n```',
      expectedLine: 1,
    },
    {
      name: 'adds leading newline when text exists before cursor',
      lines: ['hello'],
      selection: {
        startLineNumber: 1,
        startColumn: 6,
        endLineNumber: 1,
        endColumn: 6,
        isEmpty: () => true,
      },
      expectedText: '\n```markdown\n\n```',
      expectedLine: 2,
    },
  ])('$name', ({ lines, selection, expectedText, expectedLine }) => {
    const { monaco, editor } = setupCodeblockMock(lines, selection)

    codeblockAction(monaco)

    expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
      expect.objectContaining({ text: expectedText }),
    ])

    expect(editor.setSelection).toHaveBeenCalledWith({
      startLineNumber: expectedLine,
      startColumn: 4,
      endLineNumber: expectedLine,
      endColumn: 12,
    })

    expect(editor.focus).toHaveBeenCalled()
  })

  it.each([
    {
      name: 'wraps selected text',
      lines: ['hello world'],
      selection: {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 12,
        isEmpty: () => false,
      },
      expectedText: '```markdown\nhello world\n```',
      expectedLine: 1,
    },
    {
      name: 'wraps selection with leading newline when text precedes selection',
      lines: ['text world'],
      selection: {
        startLineNumber: 1,
        startColumn: 6,
        endLineNumber: 1,
        endColumn: 11,
        isEmpty: () => false,
      },
      expectedText: '\n```markdown\nworld\n```',
      expectedLine: 2,
    },
  ])('$name', ({ lines, selection, expectedText, expectedLine }) => {
    const { monaco, editor } = setupCodeblockMock(lines, selection)

    codeblockAction(monaco)

    expect(editor.executeEdits).toHaveBeenCalledWith(actionName, [
      expect.objectContaining({ text: expectedText }),
    ])

    expect(editor.setSelection).toHaveBeenCalledWith({
      startLineNumber: expectedLine,
      startColumn: 4,
      endLineNumber: expectedLine,
      endColumn: 12,
    })
  })

  it('does nothing when cursor is inside a code block', () => {
    const lines = ['```', 'inside block', '```']
    const selection = {
      startLineNumber: 2,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 1,
      isEmpty: () => true,
    }

    const { monaco, editor } = setupCodeblockMock(lines, selection)
    codeblockAction(monaco)

    expect(editor.executeEdits).not.toHaveBeenCalled()
  })

  it('does nothing when selection contains backticks', () => {
    const lines = ['some ``` text']
    const selection = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 14,
      isEmpty: () => false,
    }

    const { monaco, editor } = setupCodeblockMock(lines, selection)
    codeblockAction(monaco)

    expect(editor.executeEdits).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'editor is null',
      monaco: { editor: { value: null } },
    },
    {
      name: 'selection is null',
      monaco: {
        editor: {
          value: {
            getSelection: () => null,
            getModel: () => ({}),
            executeEdits: vi.fn(),
            focus: vi.fn(),
          },
        },
      },
    },
  ])('does nothing when $name', ({ monaco }) => {
    expect(() => codeblockAction(monaco as any)).not.toThrow()
  })
})

describe('createTableAction', () => {
  const actionName = 'table'
  const tableAction = createTableAction(actionName)

  function setupTableMock(lines: string[], selection: any) {
    const model = {
      getLineContent: vi.fn((ln: number) => lines[ln - 1] ?? ''),
      getLineCount: vi.fn(() => lines.length),
    }

    const editor = {
      getSelection: vi.fn(() => selection),
      getModel: vi.fn(() => model),
      executeEdits: vi.fn(),
      setPosition: vi.fn(),
      focus: vi.fn(),
    }

    return { monaco: { editor: { value: editor } } as any, editor }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    { startLine: 1, expectedLine: 5 },
    { startLine: 3, expectedLine: 7 },
  ])('inserts table at correct position (line $startLine)', ({ startLine, expectedLine }) => {
    const selection = {
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: startLine,
      endColumn: 1,
      isEmpty: () => true,
    }

    const { monaco, editor } = setupTableMock(['line 1', 'line 2', ''], selection)

    tableAction(monaco)

    expect(editor.executeEdits).toHaveBeenCalled()
    expect(editor.setPosition).toHaveBeenCalledWith({
      lineNumber: expectedLine,
      column: 1,
    })
    expect(editor.focus).toHaveBeenCalled()
  })

  it('does nothing when cursor is inside a code block', () => {
    const lines = ['```', 'inside block', '```']
    const selection = {
      startLineNumber: 2,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 1,
      isEmpty: () => true,
    }

    const { monaco, editor } = setupTableMock(lines, selection)
    tableAction(monaco)

    expect(editor.executeEdits).not.toHaveBeenCalled()
  })

  it('does nothing when editor is null', () => {
    expect(() =>
      tableAction({ editor: { value: null } } as any),
    ).not.toThrow()
  })
})
