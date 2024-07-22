import type { SAMLSchema } from '../../types/plugins/saml'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const samlSchema: SAMLSchema = {
  'config-session_redis_cluster_nodes': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Cluster Node',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'IP',
          model: 'ip',
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
