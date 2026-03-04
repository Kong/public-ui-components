import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerMarkdownShortcuts } from './markdownShortcuts'

function createEditorMock(
  lineContent: string,
  language: string,
  isEmpty = true,
  lineNumber = 1,
) {
  const selection = {
    startLineNumber: lineNumber,
    startColumn: lineContent.length + 1,
    endLineNumber: lineNumber,
    endColumn: lineContent.length + 1,
    isEmpty: () => isEmpty,
  }

  const model = {
    getLanguageId: vi.fn(() => language),
    getLineContent: vi.fn((ln: number) =>
      ln === lineNumber ? lineContent : '',
    ),
  }

  const addActionSpy = vi.fn()
  const executeEditsSpy = vi.fn()
  const setPositionSpy = vi.fn()
  const revealLineSpy = vi.fn()
  const triggerSpy = vi.fn()

  const editor = {
    addAction: addActionSpy,
    getModel: vi.fn(() => model),
    getSelection: vi.fn(() => selection),
    executeEdits: executeEditsSpy,
    setPosition: setPositionSpy,
    revealLine: revealLineSpy,
    trigger: triggerSpy,
  }

  return {
    editor,
    addActionSpy,
    executeEditsSpy,
    setPositionSpy,
    revealLineSpy,
    triggerSpy,
  }
}

function getRunHandler(addActionSpy: ReturnType<typeof vi.fn>) {
  expect(addActionSpy).toHaveBeenCalledTimes(1)
  return addActionSpy.mock.calls[0][0].run
}

describe('registerMarkdownShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers the list continuation action', () => {
    const { editor, addActionSpy } = createEditorMock('', 'markdown')
    registerMarkdownShortcuts(editor as any)

    expect(addActionSpy).toHaveBeenCalledTimes(1)

    const descriptor = addActionSpy.mock.calls[0][0]
    expect(descriptor.id).toBe('editor.action.listContinuation')
    expect(descriptor.precondition).toContain('editorTextFocus')
  })

  describe('unordered list continuation', () => {
    it.each(['- hello', '* hello', '+ hello'])(
      'continues unordered list "%s"',
      (input) => {
        const {
          editor,
          addActionSpy,
          executeEditsSpy,
        } = createEditorMock(input, 'markdown')

        registerMarkdownShortcuts(editor as any)
        const run = getRunHandler(addActionSpy)
        run(editor)

        const symbol = input.trim()[0]

        expect(executeEditsSpy).toHaveBeenCalledWith(
          'listContinuation',
          [expect.objectContaining({ text: `\n${symbol} ` })],
        )
      },
    )

    it('removes empty unordered list item', () => {
      const {
        editor,
        addActionSpy,
        executeEditsSpy,
      } = createEditorMock('- ', 'markdown')

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(executeEditsSpy).toHaveBeenCalledWith(
        'listContinuation',
        [
          expect.objectContaining({
            text: '',
            range: expect.objectContaining({
              startColumn: 1,
              endColumn: 3,
            }),
          }),
        ],
      )
    })
  })

  describe('ordered list continuation', () => {
    it('continues ordered list with increment', () => {
      const {
        editor,
        addActionSpy,
        executeEditsSpy,
        setPositionSpy,
      } = createEditorMock('1. first item', 'markdown')

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(executeEditsSpy).toHaveBeenCalledWith(
        'listContinuation',
        [expect.objectContaining({ text: '\n2. ' })],
      )

      expect(setPositionSpy).toHaveBeenCalledWith({
        lineNumber: 2,
        column: 4,
      })
    })

    it('handles multi-digit ordered lists', () => {
      const {
        editor,
        addActionSpy,
        executeEditsSpy,
      } = createEditorMock('99. item', 'markdown')

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(executeEditsSpy).toHaveBeenCalledWith(
        'listContinuation',
        [expect.objectContaining({ text: '\n100. ' })],
      )
    })

    it('removes empty ordered list item', () => {
      const {
        editor,
        addActionSpy,
        executeEditsSpy,
      } = createEditorMock('1. ', 'markdown')

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(executeEditsSpy).toHaveBeenCalledWith(
        'listContinuation',
        [
          expect.objectContaining({
            text: '',
            range: expect.objectContaining({
              startColumn: 1,
              endColumn: 4,
            }),
          }),
        ],
      )
    })
  })

  describe('task list continuation', () => {
    it.each([
      '- [ ] my task',
      '- [x] done task',
    ])('continues task list "%s" with unchecked box', (input) => {
      const {
        editor,
        addActionSpy,
        executeEditsSpy,
      } = createEditorMock(input, 'markdown')

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(executeEditsSpy).toHaveBeenCalledWith(
        'listContinuation',
        [expect.objectContaining({ text: '\n- [ ] ' })],
      )
    })

    it.each(['- [ ] ', '- [x] '])(
      'removes empty task item "%s"',
      (input) => {
        const {
          editor,
          addActionSpy,
          executeEditsSpy,
        } = createEditorMock(input, 'markdown')

        registerMarkdownShortcuts(editor as any)
        const run = getRunHandler(addActionSpy)
        run(editor)

        expect(executeEditsSpy).toHaveBeenCalledWith(
          'listContinuation',
          [expect.objectContaining({ text: '' })],
        )
      },
    )
  })

  describe('indented list continuation', () => {
    it.each([
      { input: '  - nested item', expected: '\n  - ' },
      { input: '    3. nested item', expected: '\n    4. ' },
      { input: '  - [ ] nested task', expected: '\n  - [ ] ' },
    ])(
      'preserves indentation for "%s"',
      ({ input, expected }) => {
        const {
          editor,
          addActionSpy,
          executeEditsSpy,
        } = createEditorMock(input, 'markdown')

        registerMarkdownShortcuts(editor as any)
        const run = getRunHandler(addActionSpy)
        run(editor)

        expect(executeEditsSpy).toHaveBeenCalledWith(
          'listContinuation',
          [expect.objectContaining({ text: expected })],
        )
      },
    )
  })

  describe('fallback to default Enter', () => {
    it.each([
      { desc: 'non-markdown language', language: 'javascript', line: '- hello' },
      { desc: 'no matching list pattern', language: 'markdown', line: 'plain text' },
    ])('falls back for $desc', ({ language, line }) => {
      const {
        editor,
        addActionSpy,
        triggerSpy,
        executeEditsSpy,
      } = createEditorMock(line, language)

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(triggerSpy).toHaveBeenCalledWith(
        'listContinuation',
        'type',
        { text: '\n' },
      )
      expect(executeEditsSpy).not.toHaveBeenCalled()
    })

    it('falls back when selection is not empty', () => {
      const {
        editor,
        addActionSpy,
        triggerSpy,
        executeEditsSpy,
      } = createEditorMock('- hello', 'markdown', false)

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(triggerSpy).toHaveBeenCalled()
      expect(executeEditsSpy).not.toHaveBeenCalled()
    })

    it('falls back when model or selection is null', () => {
      const addActionSpy = vi.fn()
      const triggerSpy = vi.fn()

      const editor = {
        addAction: addActionSpy,
        getModel: vi.fn(() => null),
        getSelection: vi.fn(() => null),
        trigger: triggerSpy,
      }

      registerMarkdownShortcuts(editor as any)
      const run = getRunHandler(addActionSpy)
      run(editor)

      expect(triggerSpy).toHaveBeenCalledWith(
        'listContinuation',
        'type',
        { text: '\n' },
      )
    })
  })

  it('supports mdc language', () => {
    const {
      editor,
      addActionSpy,
      executeEditsSpy,
    } = createEditorMock('- hello', 'mdc')

    registerMarkdownShortcuts(editor as any)
    const run = getRunHandler(addActionSpy)
    run(editor)

    expect(executeEditsSpy).toHaveBeenCalledWith(
      'listContinuation',
      [expect.objectContaining({ text: '\n- ' })],
    )
  })
})
