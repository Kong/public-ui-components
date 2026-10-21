export interface PageLayoutAnchor {
  /**
   * A CSS selector matching the section this item scrolls to (`#usage`, `[data-anchor="usage"]`, ...).
   * A bare identifier (`usage`) is also accepted and looked up as `#usage`.
   * Doubles as the item's unique key, so it must be unique within the list.
   */
  id: string
  /** The display text of the navigation item */
  label: string
  /**
   * The section element itself, for pages that hold a template ref rather than a selector.
   * Takes precedence over `id`, which is then only used as the item's key.
   */
  element?: HTMLElement | null
  /**
   * Pixels left between the top of the scrolling container and the section once it has been
   * scrolled to. Defaults to the height of the sticky page header plus a small gap.
   */
  offset?: number
  /** The data-testid attribute to apply to the navigation item. Auto-generated if not provided */
  dataTestId?: string
}

export interface PageLayoutAnchorNavigationProps {
  anchors?: PageLayoutAnchor[]
}
