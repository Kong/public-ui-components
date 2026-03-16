import { KeyCode } from 'monaco-editor'
import type { editor as Editor } from 'monaco-editor'

/** Languages this module handles. */
const MARKDOWN_LANGUAGES = new Set(['markdown', 'mdc'])

/**
 * List prefix patterns for auto-continuation on Enter.
 * Each pattern defines a regex to detect the list prefix on the current line,
 * and a function to compute the prefix for the next line.
 *
 * Order matters — more specific patterns (task list) should come before
 * more general ones (unordered list with `-`).
 */
const LIST_PATTERNS: Array<{
  /** Regex that matches a line starting with a list prefix. */
  detect: RegExp
  /**
   * Given the regex match, return the prefix to insert on the next line.
   * Return `undefined` to skip (fall through to the next pattern).
   */
  nextPrefix: (match: RegExpMatchArray) => string | undefined
  /**
   * Regex that matches a line that is *only* the prefix (empty item).
   * When the user presses Enter on an empty item, the prefix is removed instead.
   */
  emptyItem: RegExp
}> = [
  // Task list: `- [ ] ` or `- [x] `
  {
    detect: /^(\s*)- \[[ x]\] /,
    nextPrefix: (m) => `${m[1]}- [ ] `,
    emptyItem: /^(\s*)- \[[ x]\] $/,
  },
  // Unordered list: `- `, `* `, `+ `
  {
    detect: /^(\s*)([-*+]) /,
    nextPrefix: (m) => `${m[1]}${m[2]} `,
    emptyItem: /^(\s*)[-*+] $/,
  },
  // Ordered list: `1. `, `2. `, etc.
  {
    detect: /^(\s*)(\d+)\. /,
    nextPrefix: (m) => `${m[1]}${Number(m[2]) + 1}. `,
    emptyItem: /^(\s*)\d+\. $/,
  },
]

/**
 * Registers an Enter-key handler on the given Monaco editor that auto-continues
 * list prefixes in markdown / mdc files.
 *
 * Behaviour:
 *  - If the current line matches a list pattern and has content after the prefix,
 *    pressing Enter inserts a new line with the appropriate continuation prefix.
 *  - If the current line is an *empty* list item (prefix only), pressing Enter
 *    removes the prefix and inserts a plain newline — effectively ending the list.
 *  - In all other cases the default Enter behaviour is preserved.
 *
 * @param editorInstance The Monaco standalone editor to hook into.
 * @returns An `IDisposable` so the caller can clean up if needed.
 */
export function registerMarkdownShortcuts(editorInstance: Editor.IStandaloneCodeEditor) {
  return editorInstance.addAction({
    id: 'editor.action.listContinuation',
    label: 'Continue List on Enter',
    keybindings: [KeyCode.Enter],
    // Only trigger when: editor has focus, is not read-only, no suggest/autocomplete widget is visible
    precondition: 'editorTextFocus && !editorReadonly && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible',
    run: (editor) => {
      const model = editor.getModel()
      const selection = editor.getSelection()

      // Fall back to default Enter when there's no model/selection,
      // a multi-line selection is active, or the language is not markdown.
      if (
        !model ||
        !selection ||
        !selection.isEmpty() ||
        !MARKDOWN_LANGUAGES.has(model.getLanguageId())
      ) {
        // Execute the default Enter behaviour
        editor.trigger('listContinuation', 'type', { text: '\n' })
        return
      }

      const lineNumber = selection.startLineNumber
      const lineContent = model.getLineContent(lineNumber)

      for (const pattern of LIST_PATTERNS) {
        const match = lineContent.match(pattern.detect)
        if (!match) continue

        // Empty list item → remove prefix, end the list
        if (pattern.emptyItem.test(lineContent)) {
          editor.executeEdits('listContinuation', [
            {
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: lineContent.length + 1,
              },
              text: '',
            },
          ])
          return
        }

        // Non-empty list item → continue with next prefix
        const nextPrefix = pattern.nextPrefix(match)
        if (nextPrefix !== undefined) {
          const column = selection.startColumn

          editor.executeEdits('listContinuation', [
            {
              range: {
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column,
              },
              text: `\n${nextPrefix}`,
            },
          ])

          // Move cursor to end of the newly inserted prefix
          const newLine = lineNumber + 1
          const newColumn = nextPrefix.length + 1
          editor.setPosition({ lineNumber: newLine, column: newColumn })
          editor.revealLine(newLine)
          return
        }
      }

      // No list pattern matched — default Enter
      editor.trigger('listContinuation', 'type', { text: '\n' })
    },
  })
}
