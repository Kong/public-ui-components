import type { editor } from 'monaco-editor'
import type { Ref } from 'vue'


export interface UseMonacoEditorOptions {
  code: Ref<string>
  language: string
  readOnly?: boolean
  theme?: EditorThemes
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

export type EditorStatus = 'loading' | 'ready'

