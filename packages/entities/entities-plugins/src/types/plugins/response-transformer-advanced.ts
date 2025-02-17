import type { CommonSchemaFields } from './shared'
import type { ResponseTransformerSchema } from './response-transformer'
import type { ArrayItem } from '../../types/plugins/shared'

export interface ResponseTransformerAdvancedSchema extends CommonSchemaFields, ResponseTransformerSchema {
  'config-allow-json': ArrayItem
  'config-replace-body': {
    label: string
    type: string
    max: boolean | number
  }
  'config-transform-functions': ArrayItem
  'config-transform-json': ArrayItem
}
