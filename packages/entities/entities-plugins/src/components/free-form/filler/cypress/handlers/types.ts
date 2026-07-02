import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'

// Cypress's default scrollBehavior ('top') scrolls the target flush against
// the viewport top, which lands it directly behind any sticky/fixed header
// (e.g. ArrayField's sticky-tabs). Scrolling to center instead avoids that
// collision without skipping any actionability check - unlike `force`, an
// element that's genuinely hidden still correctly fails.
export const SCROLL_BEHAVIOR = { scrollBehavior: 'center' } as const

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
