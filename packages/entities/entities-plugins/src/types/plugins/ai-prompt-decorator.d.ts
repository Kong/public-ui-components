import type { Field, ItemsSchema, CommonSchemaFields } from './shared'

type ItemsSchemaForKeyValuePairs = Omit<ItemsSchema, 'schema'> & {
  schema: {
    fields: Field[]
  }
}

export interface AIPromptDecoratorSchema extends CommonSchemaFields {
  'config-prompts-prepend': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    items: ItemsSchemaForKeyValuePairs
  }

  'config-prompts-append': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    items: ItemsSchemaForKeyValuePairs
  }
}
