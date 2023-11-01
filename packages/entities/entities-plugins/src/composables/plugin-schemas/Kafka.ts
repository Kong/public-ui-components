import type { KafkaSchema } from '../../types/plugins/kafka-schema'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const kafkaSchema: KafkaSchema = {
  'config-bootstrap_servers': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Bootstrap Server',
    label: 'Bootstrap Server(s)',
    placeholder: 'Enter a Bootstrap Server',
    help: 'A list of bootstrap servers',
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
