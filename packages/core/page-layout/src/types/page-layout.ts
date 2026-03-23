import type { BreadcrumbItem } from '@kong/kongponents'
import type { PageLayoutTab } from './'
import type { RouteLocationRaw } from 'vue-router'

export interface PageLayoutProps {
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Page title */
  title: string
  /** The URL to navigate back to when the back button is clicked */
  backTo?: string | RouteLocationRaw
  /** Tabs */
  tabs?: PageLayoutTab[]
}

export interface PageLayoutSlots {
  /**
   * Default slot for page content
   */
  default?(): any
}
