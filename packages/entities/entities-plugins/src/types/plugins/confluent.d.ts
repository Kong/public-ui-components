import type { ItemsSchema, CommonSchemaFields } from './shared'

export interface ConfluentSchema extends CommonSchemaFields {
  'config-bootstrap_servers': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    label: string
    placeholder: string
    items: ItemsSchema
  }
}
