import type { editor } from 'monaco-editor'
import type { JSONContext } from './json/context'

export interface DefaultContext {
  language: string
  model: editor.ITextModel
}

export type Context = JSONContext | DefaultContext
