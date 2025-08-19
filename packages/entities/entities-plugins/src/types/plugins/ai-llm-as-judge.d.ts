import type { CommonSchemaFields } from './shared'

export interface AILLMAsJudgeSchema extends CommonSchemaFields {
  'config-prompt': {
    label: string
    placeholder: string
    type: string
    rows: number
    max: boolean | number
  }
}
