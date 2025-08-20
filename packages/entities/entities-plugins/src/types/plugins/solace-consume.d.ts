import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface SolaceConsumeSchema extends CommonSchemaFields {
  'config-flow-functions': ReturnArrayItem
}
