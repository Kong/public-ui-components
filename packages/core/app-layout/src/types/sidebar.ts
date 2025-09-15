export interface SidebarSecondaryItem {
  /** The display text of the sidebar item */
  name: string
  /** The [Vue Router `to` object](https://router.vuejs.org/api/interfaces/RouterLinkProps.html#to) or a URL path (relative or absolute) to navigate to on click */
  to: string | Record<string, any>
  /** Set external to true if you want to navigate via anchor tag instead of a router-link. The `to` property must be set to a string. */
  external?: boolean
  /** Set newWindow to true if you want to open the link in a new window or tab. If the `to` property is set to a string that starts with `http*` it will open in a new window automatically. Setting newWindow to true essentially forces external to true as well. */
  newWindow?: boolean
  /** Is the sidebar item active */
  active?: boolean
  /** Number to display in a badge to the right of the L2 item name */
  badgeCount?: number
  /** The data-testid attribute to apply to the sidebar item. Auto-generated if not provided. */
  testId?: string
  /** Auto-generated (do not provide) unique key of the secondary item's top-level navigation parent item */
  parentKey?: string
}

export interface SidebarPrimaryItem extends Omit<SidebarSecondaryItem, 'parentKey' | 'badgeCount'> {
  /** Unique key of top-level navigation item. Auto-generated if not provided. */
  key: string
  /** Label to show under the name when the item is expanded */
  label?: string
  /** Is the top-level sidebar item expanded */
  expanded?: boolean
  /** The top-level navigation group to place the navigation item inside. If not provided, the sidebar item will be rendered standalone, above the L1 navigation groups (e.g. "Overview"). */
  group?: string
  /** Nested sidebar items (children) without icons */
  items?: SidebarSecondaryItem[]
}

export interface GroupConfig {
  label: string
  collapsible?: boolean // whether or not the group can be collapsed
  collapsed?: boolean // initial collapse state of the group
}

export interface GroupConfigMap {
  [key: string]: GroupConfig
}
