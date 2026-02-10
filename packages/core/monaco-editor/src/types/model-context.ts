import type { Node as JSONNode } from 'jsonc-parser'
import type { Document as YAMLDocument } from 'yaml'

export interface AbstractModelContext {
  isDefault?: true

  language: string
  /**
   * The alternative version id of the model.
   * This alternative version id is not always incremented, it will return the same
   * values in the case of undo-redo.
   */
  altVersionId: number
}

export interface DefaultModelContext extends AbstractModelContext {
  isDefault: true
}

export interface JSONModelContext extends AbstractModelContext {
  language: 'json'
  root?: JSONNode
}

export interface YAMLModelContext extends AbstractModelContext {
  language: 'yaml'
  document?: YAMLDocument.Parsed
}

export type ModelContext = JSONModelContext | YAMLModelContext | DefaultModelContext
