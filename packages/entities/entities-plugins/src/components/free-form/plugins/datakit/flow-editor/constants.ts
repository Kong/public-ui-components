import { KUI_SPACE_40, KUI_SPACE_90 } from '@kong/design-tokens'

import type { LayoutOptions } from './store/flow'
import type { KeySpec } from './utils'

export const DK_HEADER_HEIGHT = 44
export const DK_SIDE_PANEL_WIDTH = 220
export const DK_NODE_PROPERTIES_PANEL_WIDTH = 366
export const DK_NODE_PROPERTIES_PANEL_Z_INDEX = 1000 // ensure the panel is under the vault resource modal
export const DK_NODE_PROPERTIES_PANEL_OFFSET_TOP =
  DK_HEADER_HEIGHT + parseFloat(KUI_SPACE_40)

export const DK_FLOW_Z_LAYER_STEP = 1
export const DK_FLOW_GROUP_Z_OFFSET = 0
export const DK_FLOW_EDGE_Z_OFFSET = 1
export const DK_FLOW_BRANCH_EDGE_Z_OFFSET = 2
export const DK_FLOW_NODE_Z_OFFSET = 3

export const DK_BRANCH_GROUP_PADDING = parseInt(KUI_SPACE_90, 10)

export const DK_DATA_TRANSFER_MIME_TYPE = 'application/x-datakit+json'

export const HOTKEYS = {
  delete: ['Delete'],
  undo: ['Mod', 'Z'],
  redo: {
    mac: ['Mod', 'Shift', 'Z'],
    windows: ['Mod', 'Y'],
    linux: ['Mod', 'Shift', 'Z'],
  },
  copy: ['Mod', 'C'],
  paste: ['Mod', 'V'],
  duplicate: ['Mod', 'D'],
} as const satisfies Record<string, KeySpec>

export const DEFAULT_LAYOUT_OPTIONS = {
  padding: 80,
  gaps: {
    nodes: 60,
    edges: 80,
    ranks: 60,
  },
} as const satisfies Pick<LayoutOptions, 'padding' | 'gaps'>

export const DEFAULT_VIEWPORT_WIDTH = 1600
export const MAX_ZOOM_LEVEL = 1.2
export const MIN_ZOOM_LEVEL = 0
export const SCROLL_DURATION = 200

export const CONFIRM_MODAL_PROVIDE_KEY = Symbol('confirm-modal')
