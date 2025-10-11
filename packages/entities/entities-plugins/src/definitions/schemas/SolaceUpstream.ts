import type { SolaceUpstreamSchema } from '../../types/plugins/solace-upstream'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const solaceUpstreamSchema: SolaceUpstreamSchema = {
  'config-message-functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}
