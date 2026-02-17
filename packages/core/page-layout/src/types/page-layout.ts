import type { BreadcrumbItem } from '@kong/kongponents'
import type { PageLayoutTab } from './'

export interface PageLayoutProps {
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Page title */
  title: string
  /** Tabs */
  tabs?: PageLayoutTab[]
  /** Page title */
  pageTitle?: string
}

export type PageLayoutBreadcrumbIconSlotName = `icon-${string}`

export interface PageLayoutSlots {
  /**
   * Actions slot
   */
  actions?(): any
  /**
   * Default slot for page content
   */
  default?(): any
  /**
   * Breadcrumb icon slots, e.g., 'icon-home', 'icon-user', etc.
   */
  [key: PageLayoutBreadcrumbIconSlotName]: () => any
}
