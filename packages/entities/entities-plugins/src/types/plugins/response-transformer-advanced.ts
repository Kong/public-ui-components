import type { CommonSchemaFields } from './shared'
import type { ArrayItem } from '../../types/plugins/shared'

export interface ResponseTransformerAdvancedSchema extends CommonSchemaFields {
  'config-transform-functions': ArrayItem
  'config-transform-json': ArrayItem
}
