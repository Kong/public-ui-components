import {
  KUI_COLOR_BACKGROUND_DANGER,
  KUI_COLOR_BACKGROUND_DANGER_STRONGER,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_COLOR_BACKGROUND_DANGER_WEAKER,
  KUI_COLOR_BACKGROUND_DANGER_WEAKEST,
  KUI_ICON_COLOR_DANGER,
  KUI_SPACE_100,
  KUI_SPACE_20,
  KUI_SPACE_50,
  KUI_SPACE_60,
  KUI_SPACE_80,
  KUI_STATUS_COLOR_501,
} from '@kong/design-tokens'

export enum LifecycleNodeType {
  CLIENT = 'client',
  CLIENT_IN = 'clientIn',
  CLIENT_OUT = 'clientOut',
  REQUEST = 'request',
  UPSTREAM = 'upstream',
  RESPONSE = 'response',
  REQUEST_GROUP = 'requestGroup',
  RESPONSE_GROUP = 'responseGroup',
}

/** Margin of toolbars for actions, legend, etc. (VueFlow use) */
export const TOOLBAR_MARGIN = parseFloat(KUI_SPACE_60)

/** Padding to keep a clear zone around the canvas */
export const CANVAS_PADDING = parseFloat(KUI_SPACE_100)

/** Row gap between top-level nodes (e.g., individual nodes, node groups) */
export const CANVAS_ROW_GAP = parseFloat(KUI_SPACE_60)

/** Column gap between top-level nodes (e.g., individual nodes, node groups) */
export const CANVAS_COLUMN_GAP = parseFloat(KUI_SPACE_80)

/** Padding to keep a clear zone inside a node group's inner edge */
export const NODE_GROUP_PADDING = parseFloat(KUI_SPACE_50)

/** Row gap between nodes inside a node group */
export const NODE_GROUP_ROW_GAP = parseFloat(KUI_SPACE_20)

/** Column gap between nodes inside a node group */
export const NODE_GROUP_COLUMN_GAP = parseFloat(KUI_SPACE_50)

export const NODE_STRIPE_COLOR_MAPPING_START_EXP = 3

/**
 * Color mapping from nanosecond-based duration `t` to a color
 *
 * index(t) = min(6, max(0, floor(log10(t)) - 3))
 */
export const NODE_STRIPE_COLOR_MAPPING = [
  KUI_COLOR_BACKGROUND_DANGER_WEAKEST,
  KUI_COLOR_BACKGROUND_DANGER_WEAKER,
  KUI_STATUS_COLOR_501,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_ICON_COLOR_DANGER,
  KUI_COLOR_BACKGROUND_DANGER,
  KUI_COLOR_BACKGROUND_DANGER_STRONGER,
]
