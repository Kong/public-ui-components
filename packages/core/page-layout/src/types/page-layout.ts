import type { BreadcrumbItem } from '@kong/kongponents'
import type { PageLayoutTab } from './'

export interface PageLayoutProps {
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Page title */
  title: string
  /** Tabs */
  tabs?: PageLayoutTab[]
}

export interface PageLayoutSlots {
  /**
   * Default slot for page content
   */
  default?(): any
}
