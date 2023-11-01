import type { ReturnArrayItem } from '../../types/plugins/typedefs'

export interface RequestTransformerAdvancedSchema {
  'config-remove-headers': ReturnArrayItem | {},
  'config-remove.querystring': ReturnArrayItem | {},
  'config-remove-body': ReturnArrayItem | {},
  'config-replace-headers': ReturnArrayItem | {},
  'config-replace-querystring': ReturnArrayItem | {},
  'config-replace-body': ReturnArrayItem | {},
  'config-rename-headers': ReturnArrayItem | {},
  'config-rename-querystring': ReturnArrayItem | {},
  'config-rename-body': ReturnArrayItem | {},
  'config-add-headers': ReturnArrayItem | {},
  'config-add-querystring': ReturnArrayItem | {},
  'config-add-body': ReturnArrayItem | {},
  'config-append-headers': ReturnArrayItem | {},
  'config-append-querystring': ReturnArrayItem | {},
  'config-append-body': ReturnArrayItem | {},
  'config-allow-body': ReturnArrayItem | {},
}
