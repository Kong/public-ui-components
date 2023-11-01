import type { ReturnArrayItem } from '../../types/plugins/typedefs'

export interface PreFunctionSchema {
  'config-access': ReturnArrayItem | {},
  'config-body_filter': ReturnArrayItem | {},
  'config-header_filter': ReturnArrayItem | {},
  'config-certificate': ReturnArrayItem | {},
  'config-functions': ReturnArrayItem | {},
  'config-log': ReturnArrayItem | {},
  'config-rewrite': ReturnArrayItem | {},
}
