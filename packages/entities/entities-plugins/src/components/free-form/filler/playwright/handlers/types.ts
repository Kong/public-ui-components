import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'
import type { Page } from '@playwright/test'

export type HandlerOption<T extends UnionFieldSchema = UnionFieldSchema> = {
  page: Page
  fieldKey: string
  fieldSchema: T
  value: any
  typeOptions?: { delay?: number }
}

export type RecordHandlerOption = Omit<HandlerOption, 'typeOptions'> & {
  onFillChildren: () => Promise<void>
}

export type ArrayHandlerOption = Omit<HandlerOption, 'typeOptions'> & {
  onFillItem: (index: number, itemValue: any) => Promise<void>
}
