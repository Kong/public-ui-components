import type { editor } from 'monaco-editor'
import type { MarkdownActionIds } from 'src/utils/actions'
import type { Ref, Component } from 'vue'

export * from './actions'

export interface UseMonacoEditorOptions {
  code: Ref<string>
  language: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
  onChanged?: (content: string) => void
  onCreated?: () => void
  actions?: any
  /**
   * Additional Monaco editor settings
   * @see https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
  */
  monacoOptions?: Partial<editor.IStandaloneEditorConstructionOptions>
}


export type EditorThemes = 'light' | 'dark'

export type CommandItem = editor.IActionDescriptor

export interface MonacoEditorActionButton {
  id: string
  label?: string
  keybindings?: string[]
  icon: Component
  action: MarkdownActionIds | (() => void)
}

