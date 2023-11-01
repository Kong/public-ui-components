import { metricFieldsSchema } from './MetricFields'

export default {
  'config-static_tags': {
    ...metricFieldsSchema,
    items: {
      type: 'object',
      default: () => ({}),
      schema: {
        fields: [
          {
            model: 'name',
            label: 'name',
            type: 'input',
            inputType: 'string',
            id: 'schema_name',
          },
          {
            model: 'value',
            label: 'value',
            type: 'input',
            inputType: 'string',
            id: 'schema_value',
          },
        ],
      },
    },
  },
}
