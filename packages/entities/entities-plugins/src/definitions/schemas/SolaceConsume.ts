import type { SolaceConsumeSchema } from '../../types/plugins/solace-consume'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const solaceConsumeSchema: SolaceConsumeSchema = {
  'config-flow-functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
