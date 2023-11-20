import type { ItemsSchema, CommonSchemaFields } from '../../types/plugins/shared'

export interface KafkaSchema extends CommonSchemaFields {
  'config-bootstrap_servers': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    newElementButtonLabel: string
    label: string
    placeholder: string
    help: string
    items: ItemsSchema
  }
}
