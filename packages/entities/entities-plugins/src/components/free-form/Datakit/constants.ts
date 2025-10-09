import type { KeySpec } from './flow-editor/utils'

import { KUI_SPACE_40 } from '@kong/design-tokens'

export const DK_HEADER_HEIGHT = 44
export const DK_SIDE_PANEL_WIDTH = 220
export const DK_NODE_PROPERTIES_PANEL_WIDTH = 366
export const DK_NODE_PROPERTIES_PANEL_Z_INDEX = 1000 // ensure the panel is under the vault resource modal
export const DK_NODE_PROPERTIES_PANEL_OFFSET_TOP =
  DK_HEADER_HEIGHT + parseFloat(KUI_SPACE_40)

/** The 5 implicit nodes always present. */
export const IMPLICIT_NODE_TYPES = [
  'request',
  'service_request',
  'service_response',
  'response',
  'vault',
] as const

export const IMPLICIT_NODE_NAMES = IMPLICIT_NODE_TYPES

export const VISIBLE_IMPLICIT_NODE_NAMES = [
  'request',
  'service_request',
  'service_response',
  'response',
] as const

export const CONFIG_NODE_TYPES = [
  'call',
  'jq',
  'exit',
  'property',
  'static',
  'branch',
  'cache',
] as const

export const HTTP_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'TRACE',
  'CONNECT',
] as const

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

export const DK_FLOW_Z_LAYER_STEP = 1
export const DK_FLOW_GROUP_Z_OFFSET = 0
export const DK_FLOW_EDGE_Z_OFFSET = 1
export const DK_FLOW_BRANCH_EDGE_Z_OFFSET = 2
export const DK_FLOW_NODE_Z_OFFSET = 3
