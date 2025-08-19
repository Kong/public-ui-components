import type { AILLMAsJudgeSchema } from '../../types/plugins/ai-llm-as-judge'

export const aiLlmAsJudgeSchema: AILLMAsJudgeSchema = {
  'config-prompt': {
    label: 'Prompt',
    placeholder: 'Enter an API spec',
    type: 'textArea',
    rows: 4,
    max: false,
  },
}
