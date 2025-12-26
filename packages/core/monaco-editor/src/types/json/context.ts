import type { Node } from 'jsonc-parser'
import type { DefaultContext } from '../context'

export interface JSONContext extends DefaultContext {
  language: 'json'
  root?: Node
}
