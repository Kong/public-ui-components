import type { ConfluentSchema } from '../../types/plugins/confluent'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const confluentSchema: ConfluentSchema = {
  'config-bootstrap_servers': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Bootstrap Server',
    label: 'Bootstrap Server(s)',
    placeholder: 'Enter a Bootstrap Server',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Host',
          model: 'host',
          type: 'input',
          inputType: 'text',
        }, {
          label: 'Port',
          model: 'port',
          type: 'input',
          inputType: 'number',
        }],
      },
    },
  },
}
