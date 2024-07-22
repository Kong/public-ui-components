import type { AIRateLimitingAdvancedSchema } from '../../types/plugins/ai-rate-limiting-advanced'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const aiRateLimitingAdvancedSchema: AIRateLimitingAdvancedSchema = {
  'config-llm_providers': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Provider',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Window Size',
          model: 'window_size',
          help: 'Window size to apply a limit to (defined in seconds)',
          type: 'input',
          inputType: 'number',
        }, {
          label: 'Name',
          model: 'name',
          help: 'The llm providers.',
          type: 'select',
          values: [
            'anthropic',
            'azure',
            'cohere',
            'llama2',
            'mistral',
            'openai',
            'requestPrompt',
          ],
        }, {
          label: 'Limit',
          model: 'limit',
          help: 'Limit applied to the llm provider.',
          type: 'input',
          inputType: 'number',
        }],
      },
    },
  },
}
