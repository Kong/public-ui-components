// TODO: maybe replace with store for future

import type { Ref } from 'vue'
import type { PaneConfig } from '../types'

export interface SplitPaneContext {
  panes: Ref<PaneConfig[]>
  indexedPanes: Ref<Record<number, PaneConfig>>
  isDragging: Ref<boolean>
  horizontal: Ref<boolean>

  registerPane(pane: Omit<PaneConfig, 'index'> & { order: number }): void
  unregisterPane(id: number): void
  updatePane(id: number, patch: Partial<PaneConfig>): void

  startDrag(index: number): void
  drag(index: number, position: number): void
  endDrag(): void
}

export const SplitPaneKey = Symbol('SplitPane')
