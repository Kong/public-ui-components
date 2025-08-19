import type { Field, ItemsSchema, CommonSchemaFields } from './shared'

type ItemsSchemaForKeyValuePairs = Omit<ItemsSchema, 'schema'> & {
  schema: {
    fields: Field[]
  }
}

export interface AILLMAsJudgeSchema extends CommonSchemaFields {
  'config-prompt': {
    label: string
    placeholder: string
    type: string
    rows: number
    max: boolean | number
  }
}
