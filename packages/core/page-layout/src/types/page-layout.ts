import type { BreadcrumbItem } from '@kong/kongponents'
import type { PageLayoutTab } from './'
import type { RouteLocationRaw } from 'vue-router'

export interface PageShortcutData {
  /** The display label of the page shortcut */
  label: string
  /** The URL path of the page shortcut */
  path: string
  /** The entity type of the page shortcut */
  entityType: string
  /** The display label of the parent entity */
  parentLabel?: string
}

export interface PageLayoutProps {
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Page title */
  title: string
  /** The URL to navigate back to when the back button is clicked */
  backTo?: string | RouteLocationRaw
  /** Tabs */
  tabs?: PageLayoutTab[]
  /** Providing this prop "marks" the current page as an entity page that can be added to shortcuts (favorites and recents) */
  pageShortcutData?: PageShortcutData
}

export interface PageLayoutSlots {
  /**
   * Default slot for page content
   */
  default?(): any
  /**
   * Actions slot for page actions
   */
  actions?(): any
  /**
   * Title after slot for page title after content
   */
  'title-after'(): any
}
