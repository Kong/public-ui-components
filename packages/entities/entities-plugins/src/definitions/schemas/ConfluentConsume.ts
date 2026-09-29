import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'
import type { ConfluentConsumeSchema } from '../../types/plugins/confluent-consume'

export const confluentConsumeSchema: ConfluentConsumeSchema = {
  'config-message_by_lua_functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
