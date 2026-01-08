import type { JSONModelContext } from './json/model-context'

export interface AbstractModelContext {
  isDefault?: true

  language: string
  altVersionId: number
}

export interface DefaultModelContext extends AbstractModelContext {
  isDefault: true
}

export type ModelContext = JSONModelContext | DefaultModelContext
