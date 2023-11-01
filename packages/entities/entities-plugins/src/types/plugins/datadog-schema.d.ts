import type { ItemsSchema } from '../../types/plugins/shared'

export interface DatadogSchema {
  'config-metrics': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string
    items: ItemsSchema
  }
}
