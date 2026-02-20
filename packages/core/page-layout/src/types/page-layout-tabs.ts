import type { RouteLocationRaw } from 'vue-router'

export interface PageLayoutTab {
  /** The unique kebab-case key of the tab */
  key: string
  /** The display text of the navbar tab */
  label: string
  /** The [Vue Router `to` object](https://router.vuejs.org/api/interfaces/RouterLinkProps.html#to) or a URL path (relative or absolute) to navigate to on click */
  to: string | RouteLocationRaw
  /** Is the navbar tab active */
  active?: boolean
  /** The data-testid attribute to apply to the navbar tab. Auto-generated if not provided */
  dataTestId?: string
}

export interface PageLayoutTabsProps {
  tabs?: PageLayoutTab[]
}

