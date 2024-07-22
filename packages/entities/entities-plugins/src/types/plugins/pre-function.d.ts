import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface PreFunctionSchema extends CommonSchemaFields {
  'config-access': ReturnArrayItem | object,
  'config-body_filter': ReturnArrayItem | object,
  'config-header_filter': ReturnArrayItem | object,
  'config-certificate': ReturnArrayItem | object,
  'config-functions': ReturnArrayItem | object,
  'config-log': ReturnArrayItem | object,
  'config-rewrite': ReturnArrayItem | object,
}
