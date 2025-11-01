import type { editor } from 'monaco-editor'
import type { Ref } from 'vue'

/**
 * Options for the Monaco editor composable
 */
export interface UseMonacoEditorOptions {
  /**
   * The initial content of the editor
   */
  code: Ref<string>
  /**
   * The programming language for syntax highlighting
   */
  language: string
  /**
   * Whether the editor is read-only
  */
  readOnly?: boolean
  /**
   * The theme of the editor
   */
  theme?: EditorThemes
  /**
   * Callback function triggered when the content changes
   */
  onChanged?: (content: string) => void
  /**
   * Callback function triggered when the editor is created
   */
  onCreated?: () => void
  /**
   * Additional actions to be added to the editor
   */
  actions?: any
  /**
   * Additional Monaco editor settings
   * @see https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
  */
  monacoOptions?: Partial<editor.IStandaloneEditorConstructionOptions>
}

/** The themes available for the Monaco editor */
export type EditorThemes = 'light' | 'dark'

/** The status of the Monaco editor */
export type EditorStatus = 'loading' | 'ready'


export interface MonacoEditorStates {
  /**
     * The current status of the editor instance.
     * @type {'loading' | 'ready'}
     * @default 'loading'
    */
  editorStatus: EditorStatus

  /**
     * Indicates whether the search box is currently visible.
     * @default false
    */
  searchBoxIsRevealed: boolean

  /**
     * Whether the editor currently contains any content.
     * @default false
    */
  hasContent: boolean

  /**
     * The current theme of the editor.
     * @type {'light' | 'dark'}
     * @default 'light'
    */
  theme: EditorThemes
}
