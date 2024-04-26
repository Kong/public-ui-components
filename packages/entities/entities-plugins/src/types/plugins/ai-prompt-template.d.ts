import type { Field, ItemsSchema, CommonSchemaFields } from './shared'

type ItemsSchemaForKeyValuePairs = Omit<ItemsSchema, 'schema'> & {
  schema: {
    fields: Field[]
  }
}

export interface AIPromptTemplateSchema extends CommonSchemaFields {
  'config-templates': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    items: ItemsSchemaForKeyValuePairs
  }
}
