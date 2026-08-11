import type { UnionFieldSchema } from '../../../../../types/plugins/form-schema'

// Cypress's default scrollBehavior ('top') scrolls the target flush against
// the viewport top, which lands it directly behind any sticky/fixed header
// (e.g. ArrayField's sticky-tabs). Scrolling to center instead avoids that
// collision without skipping any actionability check - unlike `force`, an
// element that's genuinely hidden still correctly fails. Unlike the one-shot
// `scrollIntoViewNative` below, this re-applies on every actionability retry
// inside a single `.type()`/`.click()` call, so it still catches the target
// if late layout settling (e.g. a tab's content still mounting) moves it
// after the initial scroll.
export const SCROLL_BEHAVIOR = { scrollBehavior: 'center' } as const

// Host apps can embed the form inside their own fixed-position, internally
// scrolling containers (e.g. a slideout panel). Cypress's built-in
// scrollable-ancestor detection (which `scrollBehavior` relies on) can fail
// to find the right container in that layout, leaving the target
// permanently out of view no matter what `scrollBehavior` is set. The
// native `Element.scrollIntoView()` walks the real scroll-container chain
// per spec regardless of `position: fixed`, so use it as a first pass
// before the Cypress action runs. This only runs once though - keep
// SCROLL_BEHAVIOR too for the retry-loop coverage it provides.
export function scrollIntoViewNative(selector: string): void {
  cy.get(selector).then(($el) => {
    $el[0]?.scrollIntoView({ block: 'center', inline: 'nearest' })
  })
}

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
