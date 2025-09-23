import type { ExitTransformerSchema } from '../../types/plugins/exit-transformer'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const exitTransformerSchema: ExitTransformerSchema = {
  'config-functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
