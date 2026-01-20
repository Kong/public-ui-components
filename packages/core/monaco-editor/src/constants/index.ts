import type { editor } from 'monaco-editor'
import { KUI_FONT_FAMILY_CODE, KUI_FONT_SIZE_20, KUI_FONT_WEIGHT_MEDIUM, KUI_LINE_HEIGHT_30 } from '@kong/design-tokens'

export const DEFAULT_MONACO_OPTIONS = Object.freeze({
  autoClosingQuotes: 'always',
  automaticLayout: true, // Auto resize layout
  bracketPairColorization: {
    enabled: true,
  },
  hideCursorInOverviewRuler: true, // hide the cursor position in the minimap TODO: maybe hide it on first line or change it colour
  fontFamily: KUI_FONT_FAMILY_CODE,
  fontSize: Number(KUI_FONT_SIZE_20.replace('px', '')),
  fontWeight: KUI_FONT_WEIGHT_MEDIUM,
  lineHeight: Number(KUI_LINE_HEIGHT_30.replace('px', '')),
  formatOnPaste: true,
  formatOnType: true, // Add to enable automatic formatting as the user types.
  padding: {
    top: 0,
    bottom: 0,
  },
  lineNumbersMinChars: 3,
  minimap: {
    enabled: false,
  },
  stickyScroll: {
    enabled: true,
  },
  suggest: {
    showWords: false, // Prevent showing word suggestions that exist in the document
  },
  quickSuggestions: true, // Enable quick suggestions
  suggestOnTriggerCharacters: true, // Allow suggestions on trigger characters
  wordBasedSuggestions: 'off',
  overviewRulerLanes: 0,
  renderWhitespace: 'boundary',
  scrollBeyondLastLine: false,
  roundedSelection: false,
  wordWrapColumn: 120,
  colorDecorators: true,
  folding: true, // Enable code folding for MDC block components
  fixedOverflowWidgets: true, // Ensure suggestion widgets can overflow container
  tabSize: 2,
  detectIndentation: false, // Important as to not override tabSize
  insertSpaces: true, // Since the formatter utilizes spaces, we set to true to insert spaces when pressing Tab
  trimAutoWhitespace: true,
  wordWrap: 'bounded',
  find: {
    addExtraSpaceOnTop: false, // we need this set to false to get the correct absolute position, otherwise when the search box opens the content shifts
  },
} as const satisfies Partial<editor.IStandaloneEditorConstructionOptions>)
