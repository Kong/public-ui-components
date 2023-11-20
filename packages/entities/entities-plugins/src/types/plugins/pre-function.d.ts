import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface PreFunctionSchema extends CommonSchemaFields {
  'config-access': ReturnArrayItem | {},
  'config-body_filter': ReturnArrayItem | {},
  'config-header_filter': ReturnArrayItem | {},
  'config-certificate': ReturnArrayItem | {},
  'config-functions': ReturnArrayItem | {},
  'config-log': ReturnArrayItem | {},
  'config-rewrite': ReturnArrayItem | {},
}
