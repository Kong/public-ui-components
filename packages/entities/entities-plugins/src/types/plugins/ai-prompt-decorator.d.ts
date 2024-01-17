import type { Field, ItemsSchema, CommonSchemaFields } from './shared'

type FieldForKeyValuePairs = Field & {
  newElementButtonLabelClasses?: string
  newElementButtonLabel?: string
  keyInputPlaceholder?: string
  valueInputPlaceholder?: string
}

type ItemsSchemaForKeyValuePairs = Omit<ItemsSchema, 'schema'> & {
  schema: {
    fields: FieldForKeyValuePairs[]
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
