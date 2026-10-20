export interface PageLayoutAnchor {
  /** The unique kebab-case key of the anchor */
  key: string
  /** The display text of the navigation item */
  label: string
  /**
   * A CSS selector matching the section this item scrolls to, e.g. `#usage` or
   * `[data-anchor="usage"]`. Ignored when `element` is set; one of the two must be provided for
   * the item to resolve to anything.
   */
  selector?: string
  /**
   * The section element itself, for pages that hold a template ref rather than a selector.
   * Takes precedence over `selector`.
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
