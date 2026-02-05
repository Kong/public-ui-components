import type { editor } from 'monaco-editor'
import type { Component, Ref } from 'vue'
import type { BuiltInActionIds } from '../types/actions'
import type { useMonacoEditor } from '../composables/useMonacoEditor'

/**
 * Options for the Monaco editor composable
 */
export interface UseMonacoEditorOptions {
  /**
   * The content of the editor
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
   * Callback function triggered when the editor is ready
   */
  onReady?: (editor: editor.IStandaloneCodeEditor) => void
  /**
   * Custom actions to register with the editor
   */
  actions?: MonacoEditorActionConfig[]
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

export interface MonacoEditorActionButton {
  /** Unique identifier for the action */
  id: string
  /** Display label for the action */
  label?: string
  /**
   * Keybindings associated with the action
   * TODO: explain ctrl vs command etc.
   */
  keybindings?: string[]
  /** Icon component for the action button */
  icon: Component
  /**
   * The action to execute when the button is clicked.
   * Can be:
   * - A function that receives the editor instance
   * - A string ID of a Monaco editor command to trigger
   */
  action: BuiltInActionIds | ((editor: ReturnType<typeof useMonacoEditor>) => void)
}

/**
 * Configuration for a toolbar action, extending the base action button with placement and ordering
 */
export interface MonacoEditorActionConfig extends Partial<MonacoEditorActionButton> {
  /**
   * Where the action should appear in the toolbar
   * @default 'left'
   */
  placement?: 'left' | 'center' | 'right'
  /**
   * Order of the action within its placement (lower numbers appear first)
   * @default 100
   */
  order?: number
  /**
   * Group identifier for visual grouping with separators
   * Actions with the same group value will be grouped together
   */
  group?: number | string
  /**
   * Whether to show this action in the context menu (right-click)
   * @default true
   */
  showInContextMenu?: boolean
  /**
   * Context menu group identifier for organizing actions in the context menu
   * Actions with the same contextMenuGroupId will be grouped together
   * @default 'navigation'
   */
  contextMenuGroupId?: string
  /**
   * Order of the action within its context menu group (lower numbers appear first)
   * @default 1
   */
  contextMenuOrder?: number
}

/**
 * Configuration options for the Monaco Editor toolbar
 */
export interface MonacoEditorToolbarOptions {
  /**
   * Configuration for toolbar actions
   */
  actions?: {
    /** Built-in predefined actions */
    /** Format action - formats the editor content */
    format?: boolean | MonacoEditorActionConfig
    /** Full screen action - toggles full screen mode */
    fullScreen?: boolean | MonacoEditorActionConfig
    /** Search action - toggles search widget */
    search?: boolean | MonacoEditorActionConfig

    /** Custom user-defined actions */
    [key: string]: boolean | MonacoEditorActionConfig | undefined
  }
}
