import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'

export type HandlerOption<T extends UnionFieldSchema = UnionFieldSchema> = {
  fieldKey: string
  fieldSchema: T
  value: any
}

export type RecordHandlerOption = HandlerOption & {
  onFillChildren: () => void
}

export type ArrayHandlerOption = HandlerOption & {
  onFillItem: (index: number, itemValue: any) => void
}

export type MapHandlerOption = HandlerOption & {
  onFillEntry: (kidId: string, entryValue: any) => void
}
