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
