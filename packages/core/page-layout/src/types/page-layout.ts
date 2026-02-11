import type { BreadcrumbItem } from '@kong/kongponents'
import type { PageLayoutNavbarTabs } from './'

export interface PageLayoutProps {
  /** Boolean to determine if the page should use the new Konnect layout */
  konnectLayoutNext?: boolean
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Page title */
  title: string
  /** Tabs */
  tabs?: PageLayoutNavbarTabs
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
