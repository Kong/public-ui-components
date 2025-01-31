import type { ResponseTransformerSchema } from '../../types/plugins/response-transformer'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const responseTransformerSchema: ResponseTransformerSchema = {
  'config-add-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Add.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 15,
      max: false,
    },
  },
  'config-append-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Append.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 15,
      max: false,
    },
  },
  'config-remove-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Remove.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 15,
      max: false,
    },
  },
  'config-replace-json': {
    ...ArrayInputFieldSchema,
    label: 'Config.Replace.Json',
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      rows: 15,
      max: false,
    },
  },
}
