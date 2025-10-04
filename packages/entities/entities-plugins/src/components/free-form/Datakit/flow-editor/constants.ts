import type { LayoutOptions } from './store/flow'

export const DEFAULT_LAYOUT_OPTIONS = {
  padding: 80,
  gaps: {
    nodes: 40,
    edges: 80,
    ranks: 40,
  },
} as const satisfies Pick<LayoutOptions, 'padding' | 'gaps'>

export const DEFAULT_VIEWPORT_WIDTH = 1600
export const MAX_ZOOM_LEVEL = 1.2
export const MIN_ZOOM_LEVEL = 0
export const SCROLL_DURATION = 200

export const CONFIRM_MODAL_PROVIDE_KEY = Symbol('confirm-modal')
