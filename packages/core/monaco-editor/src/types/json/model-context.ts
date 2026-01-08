import type { Node } from 'jsonc-parser'

import type { AbstractModelContext } from '../model-context'

export interface JSONModelContext extends AbstractModelContext {
  language: 'json'
  root?: Node
}
