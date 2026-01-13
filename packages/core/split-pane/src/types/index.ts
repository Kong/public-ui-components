/**
 * Configuration options for the useSplitPane composable
 */
export interface UseSplitPaneOptions {
  /**
   * If true, the split panes are arranged horizontally (top and bottom). Default is false (left and right).
   */
  horizontal?: boolean
  /**
   * Key used for storing pane sizes in local storage.
   */
  storageKey?: string
}

/**
 * State information for a single pane's sizing constraints
 */
export interface PaneState {
  /**
   * Current size of the pane as a percentage (0-100)
   */
  size: number
  /**
   * Minimum size of the pane as a percentage (0-100)
   */
  min: number
  /**
   * Maximum size of the pane as a percentage (0-100)
   */
  max: number
}

/**
 * Complete configuration for a pane including state, identity, and DOM reference
 */
export interface PaneConfig extends PaneState {
  /**
   * Unique identifier for the pane (typically the component instance UID)
  */
  id: number
  /**
   * Current index position of the pane in the split pane array
   */
  index: number
  /**
   * The original size provided by the user (useful to know the user intention).
   * Null if no size was explicitly provided.
   */
  givenSize: number | null
  /**
   * Reference to the pane's HTML element
   */
  el: HTMLElement | null
}
