import type { Field, CommonSchemaFields } from '../../types/plugins/shared'

export interface StatsDSchema extends CommonSchemaFields {
  'config-metrics': {
    type: string
    showRemoveButton: boolean
    newElementButtonLabelClasses: string
    itemContainerComponent: string
    fieldClasses: string

    items: {
      type: string,
      // eslint-disable-next-line @typescript-eslint/ban-types
      default: Function,
      schema: {
        fields: Field[]
      }
    }
  }
}
