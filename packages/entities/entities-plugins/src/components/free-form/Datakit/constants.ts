export const DK_HEADER_HEIGHT = '44px'
export const DK_SIDE_PANEL_WIDTH = '220px'
export const DK_NODE_PROPERTIES_PANEL_WIDTH = '366px'
export const DK_NODE_PROPERTIES_PANEL_OFFSET_TOP = '52px'

/** The 4 implicit nodes always present. */
export const IMPLICIT_NODE_TYPES = [
  'request',
  'service_request',
  'service_response',
  'response',
] as const

export const IMPLICIT_NODE_NAMES = IMPLICIT_NODE_TYPES

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
