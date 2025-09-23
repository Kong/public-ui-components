import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from './shared'

export interface ExitTransformerSchema extends CommonSchemaFields {
  'config-functions': ReturnArrayItem
}
