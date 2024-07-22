import type { AIPromptTemplateSchema } from '../../types/plugins/ai-prompt-template'
import { arrayCardContainerFieldSchema } from './ArrayCardContainerFields'

export const aiPromptTemplateSchema: AIPromptTemplateSchema = {
  'config-templates': {
    ...arrayCardContainerFieldSchema,
    newElementButtonLabel: '+ Add Template',
    items: {
      type: 'object',
      schema: {
        fields: [{
          label: 'Template Name',
          model: 'name',
          help: 'Template Name, for reference in user requests',
          type: 'input',
          inputType: 'text',
        }, {
          label: 'Template String',
          model: 'template',
          help: 'Template string content, containing {{placeholders}} for variable substitution',
          type: 'textArea',
          inputType: 'text',
        }],
      },
    },
  },
}
