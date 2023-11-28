import type { Field, ItemsSchema, CommonSchemaFields } from '../../types/plugins/shared'

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

export interface RouteByHeaderSchema extends CommonSchemaFields {
  'config-rules': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    items: ItemsSchemaForKeyValuePairs
  }
}
