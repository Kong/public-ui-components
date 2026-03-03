import type { useMonacoEditor } from '../composables/useMonacoEditor'

/**
 * Creates a toggle formatting action for Monaco editor.
 *
 * Behavior:
 * - If text is selected:
 *    - Wrap selection with marker (e.g. **bold**)
 *    - If already wrapped, remove the markers
 * - If only cursor:
 *    - If inside existing markers, remove them
 *    - Otherwise insert markers and place cursor between them
 *
 * @param marker Markdown marker like '**', '_', '~~'
 * @param name   Unique edit operation name for Monaco undo stack
 */
export function createWrapAction(marker: string, name: string) {
  return (monaco: ReturnType<typeof useMonacoEditor>) => {
    const editor = monaco.editor.value
    if (!editor) return

    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return

    const markerLength = marker.length
    const isCursorOnly = selection.isEmpty()

    const startLine = selection.startLineNumber
    const startCol = selection.startColumn
    const endLine = selection.endLineNumber
    const endCol = selection.endColumn

    if (!isCursorOnly) {
      const selectedText = model.getValueInRange(selection)

      const beforeRange = {
        startLineNumber: startLine,
        startColumn: Math.max(1, startCol - markerLength),
        endLineNumber: startLine,
        endColumn: startCol,
      }

      const afterRange = {
        startLineNumber: endLine,
        startColumn: endCol,
        endLineNumber: endLine,
        endColumn: endCol + markerLength,
      }

      const isWrapped = model.getValueInRange(beforeRange) === marker && model.getValueInRange(afterRange) === marker

      if (isWrapped) {
        editor.executeEdits(name, [
          { range: afterRange, text: '' },
          { range: beforeRange, text: '' },
        ])

        editor.setSelection({
          startLineNumber: startLine,
          startColumn: startCol - markerLength,
          endLineNumber: endLine,
          endColumn: endCol - markerLength,
        })
      } else {
        editor.executeEdits(name, [
          { range: selection, text: `${marker}${selectedText}${marker}` },
        ])

        editor.setSelection({
          startLineNumber: startLine,
          startColumn: startCol + markerLength,
          endLineNumber: endLine,
          endColumn: endCol + markerLength,
        })
      }

      editor.focus()
      return
    }

    const lineContent = model.getLineContent(startLine)

    const leftText = lineContent.slice(0, startCol - 1)
    const rightText = lineContent.slice(startCol - 1)

    const leftIndex = leftText.lastIndexOf(marker)
    const rightIndex = rightText.indexOf(marker)

    const isInsideWrap = leftIndex !== -1 && rightIndex !== -1

    if (isInsideWrap) {
      // Positions of the markers
      const wrapStartCol = leftIndex + 1
      const wrapEndCol = startCol + rightIndex

      const beforeRange = {
        startLineNumber: startLine,
        startColumn: wrapStartCol,
        endLineNumber: startLine,
        endColumn: wrapStartCol + markerLength,
      }

      const afterRange = {
        startLineNumber: startLine,
        startColumn: wrapEndCol,
        endLineNumber: startLine,
        endColumn: wrapEndCol + markerLength,
      }

      editor.executeEdits(name, [
        { range: afterRange, text: '' },
        { range: beforeRange, text: '' },
      ])

      editor.setPosition({
        lineNumber: startLine,
        column: startCol - markerLength,
      })
    } else {
      // Insert new markers
      editor.executeEdits(name, [
        {
          range: selection,
          text: `${marker}${marker}`,
        },
      ])

      editor.setPosition({
        lineNumber: startLine,
        column: startCol + markerLength,
      })
    }

    editor.focus()
  }
}

/**
 * Creates an insert/wrap action with asymmetric prefix and suffix.
 *
 * Behavior:
 * - If text is selected:
 *    - Wrap selection with prefix + suffix (e.g. [selected text](url))
 *    - After wrapping, selects the suffixPlaceholder (e.g. "url") so user can type the URL
 *    - If already wrapped, removes the entire construct (prefix + text + suffix)
 * - If only cursor:
 *    - Insert prefix + placeholder + suffix and select the placeholder
 *    - Clicking again while placeholder is selected removes the entire construct
 *
 * @param prefix             Opening marker like '[' or '!['
 * @param suffix             Closing marker like '](url)'
 * @param name               Unique edit operation name for Monaco undo stack
 * @param suffixPlaceholder  Placeholder text within suffix to select after wrapping (e.g. 'url')
 */
export function createInsertAction(prefix: string, suffix: string, name: string, suffixPlaceholder?: string) {
  return (monaco: ReturnType<typeof useMonacoEditor>) => {
    const editor = monaco.editor.value
    if (!editor) return

    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return

    const prefixLength = prefix.length
    const suffixLength = suffix.length
    const isCursorOnly = selection.isEmpty()

    const startLine = selection.startLineNumber
    const startCol = selection.startColumn
    const endLine = selection.endLineNumber
    const endCol = selection.endColumn

    if (!isCursorOnly) {
      const selectedText = model.getValueInRange(selection)

      // Check if the selection is inside the URL portion of an existing construct.
      // Pattern: prefix + text + ]( + <selected url> + )
      // This handles clicking the button again after wrapping text (when "url" is selected).
      if (startLine === endLine) {
        const lineContent = model.getLineContent(startLine)
        const charsBefore = lineContent.substring(0, startCol - 1)
        const charsAfter = lineContent.substring(endCol - 1)

        if (charsBefore.endsWith('](') && charsAfter.startsWith(')')) {
          // Find the prefix that starts this construct (e.g. '[' or '![')
          const closeBracketPos = charsBefore.length - 2
          const textBeforeBracket = lineContent.substring(0, closeBracketPos)
          const prefixPos = textBeforeBracket.lastIndexOf(prefix)

          if (prefixPos !== -1) {
            // Extract the text content between prefix and ](
            const textContent = textBeforeBracket.substring(prefixPos + prefixLength)

            // Remove the entire construct, restore just the original text
            const constructStartCol = prefixPos + 1 // 1-based
            const constructEndCol = endCol + 1 // past the closing )

            editor.executeEdits(name, [{
              range: {
                startLineNumber: startLine,
                startColumn: constructStartCol,
                endLineNumber: startLine,
                endColumn: constructEndCol,
              },
              text: textContent,
            }])

            if (textContent) {
              editor.setSelection({
                startLineNumber: startLine,
                startColumn: constructStartCol,
                endLineNumber: startLine,
                endColumn: constructStartCol + textContent.length,
              })
            } else {
              editor.setPosition({
                lineNumber: startLine,
                column: constructStartCol,
              })
            }

            editor.focus()
            return
          }
        }
      }

      // Check if already wrapped with prefix...suffix
      const beforeRange = {
        startLineNumber: startLine,
        startColumn: Math.max(1, startCol - prefixLength),
        endLineNumber: startLine,
        endColumn: startCol,
      }

      const afterRange = {
        startLineNumber: endLine,
        startColumn: endCol,
        endLineNumber: endLine,
        endColumn: endCol + suffixLength,
      }

      const isWrapped = model.getValueInRange(beforeRange) === prefix && model.getValueInRange(afterRange) === suffix

      if (isWrapped) {
        // Remove the entire construct (prefix + text + suffix)
        const fullRange = {
          startLineNumber: startLine,
          startColumn: startCol - prefixLength,
          endLineNumber: endLine,
          endColumn: endCol + suffixLength,
        }

        editor.executeEdits(name, [
          { range: fullRange, text: '' },
        ])

        editor.setPosition({
          lineNumber: startLine,
          column: startCol - prefixLength,
        })
      } else {
        // Wrap the selection
        editor.executeEdits(name, [
          { range: selection, text: `${prefix}${selectedText}${suffix}` },
        ])

        // Select the suffix placeholder (e.g. "url") so user can immediately type the URL
        const placeholderOffset = suffixPlaceholder ? suffix.indexOf(suffixPlaceholder) : -1

        if (placeholderOffset !== -1 && suffixPlaceholder && startLine === endLine) {
          // Single-line: suffix starts at endCol + prefixLength (after prefix shifts content)
          const placeholderStartCol = endCol + prefixLength + placeholderOffset

          editor.setSelection({
            startLineNumber: endLine,
            startColumn: placeholderStartCol,
            endLineNumber: endLine,
            endColumn: placeholderStartCol + suffixPlaceholder.length,
          })
        } else {
          // Multi-line or no suffix placeholder: select the wrapped text
          editor.setSelection({
            startLineNumber: startLine,
            startColumn: startCol + prefixLength,
            endLineNumber: endLine,
            endColumn: endCol + prefixLength,
          })
        }
      }

      editor.focus()
      return
    }

    // No selection — insert placeholder text
    const placeholder = name

    editor.executeEdits(name, [
      {
        range: selection,
        text: `${prefix}${placeholder}${suffix}`,
      },
    ])

    // Select the placeholder text so user can type over it
    editor.setSelection({
      startLineNumber: startLine,
      startColumn: startCol + prefixLength,
      endLineNumber: startLine,
      endColumn: startCol + prefixLength + placeholder.length,
    })

    editor.focus()
  }
}
