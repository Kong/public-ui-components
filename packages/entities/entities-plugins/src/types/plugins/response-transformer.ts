import type { CommonSchemaFields } from './shared'
import type { ArrayItem } from './shared'

export interface ResponseTransformerSchema extends CommonSchemaFields {
  'config-add-json': ArrayItem
  'config-append-json': ArrayItem
  'config-remove-json': ArrayItem
  'config-replace-json': ArrayItem
}
