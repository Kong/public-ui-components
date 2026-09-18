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

/**
 * Default options for the inline diff editor, layered on top of
 * {@link DEFAULT_MONACO_OPTIONS}.
 *
 * A handful of `DEFAULT_MONACO_OPTIONS` values are wrong for a read-only diff viewer
 * and are overridden below: `formatOnPaste`/`formatOnType` (would reformat and
 * manufacture spurious diff hunks), `quickSuggestions`/`suggestOnTriggerCharacters`/
 * `autoClosingQuotes` (irrelevant while read-only, and misleading if not), and
 * `stickyScroll` (its sticky header can hide a change hunk in a single-column view).
 */
export const DEFAULT_MONACO_DIFF_OPTIONS = Object.freeze({
  ...DEFAULT_MONACO_OPTIONS,

  // Unified / inline view.
  renderSideBySide: false,
  enableSplitViewResizing: false, // there is no sash to resize in inline mode

  // Diff rendering
  renderIndicators: true, // the +/- gutter glyphs
  ignoreTrimWhitespace: false, // monaco defaults to `true`, which silently hides whitespace-only changes
  diffAlgorithm: 'advanced',
  renderOverviewRuler: false, // canvas-painted from theme colours, not brandable via CSS vars - see README
  renderGutterMenu: false, // hunk menu + revert affordances are out of scope for a read-only viewer
  renderMarginRevertIcon: false, // no-op when renderSideBySide is false; explicit for clarity
  diffCodeLens: false,
  diffWordWrap: 'inherit',
  hideUnchangedRegions: {
    enabled: false,
  },
  experimental: {
    showMoves: false,
    useTrueInlineView: false,
  },

  // Editability - read-only viewer
  readOnly: true,
  originalEditable: false,

  // Overrides of DEFAULT_MONACO_OPTIONS values that are wrong for a read-only diff
  formatOnPaste: false,
  formatOnType: false,
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  autoClosingQuotes: 'never',
  stickyScroll: {
    enabled: false,
  },
} as const satisfies Partial<editor.IStandaloneDiffEditorConstructionOptions>)
