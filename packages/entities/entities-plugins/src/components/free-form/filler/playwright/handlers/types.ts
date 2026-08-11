import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'
import type { Page } from '@playwright/test'

export type HandlerOption<T extends UnionFieldSchema = UnionFieldSchema> = {
  page: Page
  fieldKey: string
  fieldSchema: T
  value: any
}

export type RecordHandlerOption = HandlerOption & {
  onFillChildren: () => Promise<void>
}

export type ArrayHandlerOption = HandlerOption & {
  onFillItem: (index: number, itemValue: any) => Promise<void>
}

export type MapHandlerOption = HandlerOption & {
  onFillEntry: (kidId: string, entryValue: any) => Promise<void>
}
