import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'

export interface ActionOptions {
  type?: Partial<Cypress.TypeOptions>
  click?: Partial<Cypress.ClickOptions>
  check?: Partial<Cypress.CheckOptions>
  clear?: Partial<Cypress.ClearOptions> | false
}

export const defaultActionOptions: ActionOptions = {
  type: { force: true },
  click: { force: true },
  check: { force: true },
  clear: { force: true },
}

export type HandlerOption<T extends UnionFieldSchema = UnionFieldSchema> = {
  fieldKey: string
  fieldSchema: T
  value: any
  actionOptions?: ActionOptions
}

export type RecordHandlerOption = Omit<HandlerOption, 'actionOptions'> & {
  onFillChildren: () => void
}

export type ArrayHandlerOption = Omit<HandlerOption, 'actionOptions'> & {
  onFillItem: (index: number, itemValue: any) => void
}
