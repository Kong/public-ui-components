export interface UseSplitPaneOptions {
  /**
   * If true, the split panes are arranged horizontally (top and bottom). Default is false (left and right).
   */
  horizontal?: boolean
  /**
   * If true, when resizing one pane, the other panes will adjust their sizes accordingly. Default is false.
   */
  pushOtherPanes?: boolean
  /**
   * Key used for storing pane sizes in local storage.
   */
  storageKey?: string
}


export interface PaneState {
  /**
   * Size of the pane in percentage
   */
  size: number
  /**
   * Minimum size of the pane in percentage
   */
  min: number
  /**
   * Maximum size of the pane in percentage
   */
  max: number
}


export interface PaneConfig extends PaneState {
  /**
   * Unique identifier for the pane
  */
  id: number
  /**
   * Index of the pane in the split pane
   */
  index: number
  givenSize: number | null // The given size (useful to know the user intention)
  /**
   * Reference to the pane's HTML element
   */
  el: HTMLElement | null
}
