import type { ResponseTransformerAdvancedSchema } from '../../types/plugins/response-transformer-advanced'
import { ArrayInputFieldSchema } from '../../definitions/schemas/ArrayInputFieldSchema'

export const responseTransformerAdvancedSchema: ResponseTransformerAdvancedSchema = {
  'config-transform-functions': {
    ...ArrayInputFieldSchema,
    label: 'Config.Transform.Functions',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 10,
      max: false,
    },
  },
  'config-transform-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Transform.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 10,
      max: false,
    },
  },
}
