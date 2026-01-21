import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'
import type { ActionOptions } from '../../shared/types'

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
