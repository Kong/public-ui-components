import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface RequestTransformerAdvancedSchema extends CommonSchemaFields {
  'config-remove-headers': ReturnArrayItem | object,
  'config-remove.querystring': ReturnArrayItem | object,
  'config-remove-body': ReturnArrayItem | object,
  'config-replace-headers': ReturnArrayItem | object,
  'config-replace-querystring': ReturnArrayItem | object,
  'config-replace-body': ReturnArrayItem | object,
  'config-rename-headers': ReturnArrayItem | object,
  'config-rename-querystring': ReturnArrayItem | object,
  'config-rename-body': ReturnArrayItem | object,
  'config-add-headers': ReturnArrayItem | object,
  'config-add-querystring': ReturnArrayItem | object,
  'config-add-body': ReturnArrayItem | object,
  'config-append-headers': ReturnArrayItem | object,
  'config-append-querystring': ReturnArrayItem | object,
  'config-append-body': ReturnArrayItem | object,
  'config-allow-body': ReturnArrayItem | object,
}
