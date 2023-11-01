import type { ItemsSchema } from '../../types/plugins/shared'

export interface StatsDAdvancedSchema {
  'config-allow_status_codes': {
    type: string,
    inputType: string,
    valueArrayType: string,
    valueType: string,
    label: string,
    help: string,
  },
  'config-metrics': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string,
    items: ItemsSchema
  }
}
