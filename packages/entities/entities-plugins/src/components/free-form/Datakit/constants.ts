import type { KeySpec } from './flow-editor/utils'

import { KUI_SPACE_40 } from '@kong/design-tokens'

export const DK_HEADER_HEIGHT = 44
export const DK_SIDE_PANEL_WIDTH = 220
export const DK_NODE_PROPERTIES_PANEL_WIDTH = 366
export const DK_NODE_PROPERTIES_PANEL_OFFSET_TOP =
  DK_HEADER_HEIGHT + parseFloat(KUI_SPACE_40)

/** The 4 implicit nodes always present. */
export const IMPLICIT_NODE_TYPES = [
  'request',
  'service_request',
  'service_response',
  'response',
] as const

export const IMPLICIT_NODE_NAMES = IMPLICIT_NODE_TYPES

export const CONFIG_NODE_TYPES = [
  'call',
  'jq',
  'exit',
  'property',
  'static',
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
