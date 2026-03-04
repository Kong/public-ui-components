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

/**
 * Creates a line-prefix toggle action for Monaco editor (e.g. list items).
 *
 * Behavior:
 * - Applies or removes a prefix on every line in the current selection (or the cursor line).
 * - If ALL affected lines already have the prefix, it is removed (toggle off).
 * - Otherwise the prefix is added to every line that doesn't have it (toggle on).
 * - For ordered lists, pass a `getPrefix` function that receives the 1-based line index
 *   and returns the appropriate prefix (e.g. `(i) => \`${i}. \``).
 *
 * @param prefixOrFn  A fixed string prefix (e.g. `'- '`) **or** a function `(lineIndex: number) => string`
 *                     that returns the prefix for the given 1-based line index.
 * @param name        Unique edit operation name for the Monaco undo stack.
 * @param detectPrefix Optional regex used to detect whether a line already has the prefix.
 *                     Defaults to escaping `prefixOrFn` when it is a string.
 */
export function createLinePrefixAction(
  prefixOrFn: string | ((lineIndex: number) => string),
  name: string,
  detectPrefix?: RegExp,
) {
  const getPrefix = typeof prefixOrFn === 'string'
    ? () => prefixOrFn
    : prefixOrFn

  // Build the detection regex once
  const detectRe = detectPrefix ??
    (typeof prefixOrFn === 'string'
      ? new RegExp(`^${prefixOrFn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      : null)

  return (monaco: ReturnType<typeof useMonacoEditor>) => {
    const editor = monaco.editor.value
    if (!editor) return

    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return

    const startLine = selection.startLineNumber
    const endLine = selection.endLineNumber

    // Collect line contents
    const lines: string[] = []
    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i))
    }

    // Determine if all lines already have the prefix (toggle off)
    const allHavePrefix = lines.every((line) => {
      if (detectRe) return detectRe.test(line)
      // Fallback for dynamic prefixes: check if line starts with any possible prefix
      return /^\d+\.\s/.test(line) || line.startsWith(getPrefix(1))
    })

    const edits: Array<{ range: { startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number }, text: string }> = []

    if (allHavePrefix) {
      // Remove prefixes (process from bottom to top to keep line numbers stable)
      for (let i = lines.length - 1; i >= 0; i--) {
        const lineNum = startLine + i
        const line = lines[i]

        let prefixLength = 0
        if (detectRe) {
          const match = line.match(detectRe)
          if (match) prefixLength = match[0].length
        } else {
          const prefix = getPrefix(i + 1)
          if (line.startsWith(prefix)) prefixLength = prefix.length
        }

        if (prefixLength > 0) {
          edits.push({
            range: {
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: 1 + prefixLength,
            },
            text: '',
          })
        }
      }
    } else {
      // Add prefixes (process from bottom to top)
      for (let i = lines.length - 1; i >= 0; i--) {
        const lineNum = startLine + i
        const line = lines[i]

        const hasPrefix = detectRe
          ? detectRe.test(line)
          : line.startsWith(getPrefix(i + 1))

        if (!hasPrefix) {
          const prefix = getPrefix(i + 1)
          edits.push({
            range: {
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: 1,
            },
            text: prefix,
          })
        }
      }
    }

    if (edits.length > 0) {
      editor.executeEdits(name, edits)
    }

    editor.focus()
  }
}
