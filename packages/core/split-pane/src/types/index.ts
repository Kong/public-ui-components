import type { ShallowRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export interface SplitPaneProps {
  /**
   * Should the center and right panels allow for resizing
   * @default true
   */
  resizable?: boolean
  /**
   *  Should the resize handle be hidden
   * @default true
   */
  showResizeHandle?: boolean
  /**
   * Show the navigation pane
   * @default true
   */
  showNavigation?: boolean
  /**
   * The items to show in the vertical navigation
   * @default []
   */
  navigationItems?: VerticalNavigationItem[]
  paneLeft?: {
    /** Pass false to hide the pane even if it contains slot content */
    visible?: boolean
    /* The max width of the pane */
    maxWidth?: string
  }
  paneCenter?: {
    /** Pass false to hide the pane even if it contains slot content */
    visible?: boolean
    /* The max width of the pane */
    maxWidth?: string
  }
  paneRight?: {
    /** Pass false to hide the pane even if it contains slot content */
    visible?: boolean
    /* The max width of the pane */
    maxWidth?: string
  }
}


export interface VerticalNavigationItem {
  to?: RouteLocationRaw
  tooltip: string
  active: boolean
  icon: object
  testid: string
}


export interface useSplitPaneParams {
  /** The `useTemplateRef()` of the vertical navigation component */
  verticalNavRef?: Readonly<ShallowRef<any | null>>
  /** The `useTemplateRef()` of the resizable pane's parent element */
  innerPanesContainerRef?: Readonly<ShallowRef<HTMLDivElement | null>>
  /** The `useTemplateRef()` of the left pane */
  paneLeftRef?: Readonly<ShallowRef<HTMLDivElement | null>>
  /** The `useTemplateRef()` of the center pane */
  paneCenterRef?: Readonly<ShallowRef<HTMLDivElement | null>>
  /** The `useTemplateRef()` of the right pane */
  paneRightRef?: Readonly<ShallowRef<HTMLDivElement | null>>
}
