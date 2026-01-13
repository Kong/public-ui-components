// TODO: maybe replace with store for future

import type { Ref } from 'vue'
import type { PaneConfig } from '../types'

/**
 * Context interface for managing split pane state and operations.
 * This context is provided by the SplitPane component and consumed by SplitPaneItem components.
 */
export interface SplitPaneContext {
  /** Array of all registered pane configurations */
  panes: Ref<PaneConfig[]>
  /** Map of pane configurations indexed by their unique ID */
  indexedPanes: Ref<Record<number, PaneConfig>>
  /** Whether a drag operation is currently in progress */
  isDragging: Ref<boolean>
  /** Whether the split panes are arranged horizontally (top/bottom) or vertically (left/right) */
  horizontal: boolean

  /**
   * Register a new pane in the split pane container
   * @param pane - The pane configuration excluding index
   */
  registerPane(pane: Omit<PaneConfig, 'index'>): void

  /**
   * Unregister a pane from the split pane container
   * @param id - The unique identifier of the pane to remove
   */
  unregisterPane(id: number): void

  /**
   * Update a pane's configuration
   * @param id - The unique identifier of the pane to update
   * @param patch - Partial pane configuration to merge with existing config
   */
  updatePane(id: number, patch: Partial<PaneConfig>): void

  /**
   * Start a drag operation on a divider
   * @param index - The index of the divider (between pane at index and index+1)
   */
  startDrag(index: number): void

  /**
   * Update pane sizes during a drag operation
   * @param index - The index of the divider being dragged
   * @param position - The current mouse/touch position in pixels
   */
  drag(index: number, position: number): void

  /**
   * End the current drag operation and persist sizes to storage
   */
  endDrag(): void
}

/**
 * Injection key for providing/injecting the SplitPane context
 */
export const SplitPaneKey = Symbol('SplitPane')
