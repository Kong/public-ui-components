import type { Tags } from '../../types/plugins'

interface ArrayItem {
  type: string,
  itemContainerComponent: string,
  fieldClasses: string,
  fieldItemsClasses: string,
  newElementButtonLabelClasses: string,
  inputAttributes: {
    class: string,
    style: {
      minWidth: string,
    },
    [key: string]: any,
  },
  removeElementButtonLabel: string,
  styleClasses: string,
  inputType: string,
  valueType: string,
  valueArrayType: string,
}

export interface Item {
  inputAttributes?: any,
  newElementButtonLabel?: string
}

export type ReturnArrayItem = ArrayItem & Item

export interface TypeDefs {
  [key: string]: any
  tags: Tags,
  fields: {
    arrayItems: (item: Item) => ReturnArrayItem
  }
}
