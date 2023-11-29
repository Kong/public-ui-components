import type { RouteByHeaderSchema } from '../../types/plugins/route-by-header'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const routeByHeaderSchema: RouteByHeaderSchema = {
  'config-rules': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Rule',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Upstream Name',
          model: 'upstream_name',
          type: 'input',
          help: 'Target hostname where traffic will be routed in case of condition match',
          placeholder: 'Hostname',
          inputType: 'text',
        }, {
          label: 'Condition',
          model: 'condition',
          type: 'keyValuePairs',
          help: 'List of headers name and value pairs',
          newElementButtonLabelClasses: 'kong-form-new-element-button-label',
          newElementButtonLabel: '+ Add Condition',
          keyInputPlaceholder: 'Header name',
          valueInputPlaceholder: 'Header value',
        }],
      },
    },
  },
}
