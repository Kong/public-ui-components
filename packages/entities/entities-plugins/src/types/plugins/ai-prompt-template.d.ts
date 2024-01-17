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
