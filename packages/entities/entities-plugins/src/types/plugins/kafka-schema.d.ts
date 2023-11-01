import type { ItemsSchema } from '../../types/plugins/shared'

export interface KafkaSchema {
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
