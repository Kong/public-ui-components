import type { ShallowRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export interface SplitPaneProps {
  /** Should the center and right panels allow for resizing */
  resizable?: boolean
  /** Should the resize handle be hidden */
  showResizeHandle?: boolean
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
  /** The `useTemplateRef()` of the Studio Modal Vertical Nav */
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
