export interface PageLayoutNavbarTab {
  /** The display text of the navbar tab */
  name: string
  /** The [Vue Router `to` object](https://router.vuejs.org/api/interfaces/RouterLinkProps.html#to) or a URL path (relative or absolute) to navigate to on click */
  to: string | Record<string, any>
  /** Is the navbar tab active */
  active?: boolean
  /** The data-testid attribute to apply to the navbar tab. Auto-generated if not provided */
  testId?: string
}

export type PageLayoutNavbarTabs = Record<string, PageLayoutNavbarTab>

export interface PageLayoutTabsNavbarProps {
  tabs?: PageLayoutNavbarTabs
}

