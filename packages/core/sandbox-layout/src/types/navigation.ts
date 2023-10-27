import type { RouteLocationRaw } from 'vue-router'

export interface SandboxNavigationItem {
  /** The name of the item to display in the navigation, e.g. `My page` */
  name: string
  /** The router link object, e.g. `{ name: 'my-page' }` */
  to: RouteLocationRaw
}
