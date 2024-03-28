import type { AIPromptDecoratorSchema } from '../../types/plugins/ai-prompt-decorator'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const aiPromptDecoratorSchema: AIPromptDecoratorSchema = {
  'config-prompts-prepend': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Message',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Role',
          model: 'role',
          help: 'LLM message role',
          type: 'select',
          values: [
            'system',
            'assistant',
            'user',
          ],
        }, {
          label: 'Content',
          model: 'content',
          type: 'input',
          help: 'LLM message content',
          inputType: 'text',
        }],
      },
    },
  },

  'config-prompts-append': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Message',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Role',
          model: 'role',
          help: 'LLM message role',
          type: 'select',
          values: [
            'system',
            'assistant',
            'user',
          ],
        }, {
          label: 'Content',
          model: 'content',
          type: 'input',
          help: 'LLM message content',
          inputType: 'text',
        }],
      },
    },
  },
}
