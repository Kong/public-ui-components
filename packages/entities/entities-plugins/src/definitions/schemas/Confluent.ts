import type { ConfluentSchema } from '../../types/plugins/confluent'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const confluentSchema: ConfluentSchema = {
  'config-message_by_lua_functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
