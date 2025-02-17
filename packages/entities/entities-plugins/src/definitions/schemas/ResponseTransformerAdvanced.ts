import type { ResponseTransformerAdvancedSchema } from '../../types/plugins/response-transformer-advanced'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'
import { responseTransformerSchema } from './ResponseTransformer'

export const responseTransformerAdvancedSchema: ResponseTransformerAdvancedSchema = {
  ...responseTransformerSchema,
  'config-allow-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Allow.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
  'config-replace-body': {
    label: 'Config.Replace.Body',
    type: 'textArea',
    max: false,
  },
  'config-transform-functions': {
    ...ArrayInputFieldSchema,
    label: 'Config.Transform.Functions',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
  'config-transform-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Transform.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
