export const DK_HEADER_HEIGHT = '44px'
export const DK_SIDE_PANEL_WIDTH = '220px'
export const DK_NODE_PROPERTIES_PANEL_WIDTH = '366px'
export const DK_NODE_PROPERTIES_PANEL_OFFSET_TOP = '52px'

/**
 * Standard HTTP/1.1 verbs accepted by the `call` node.
 * The string must contain only uppercase letters.
 */
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

/**
 * The type of HTTP method accepted by the `call` node.
 * The string must contain only uppercase letters.
 *
 * @default 'GET'
 */
export type HttpMethod = (typeof HTTP_METHODS)[number]

export const DK_DATA_TRANSFER_MIME_TYPE = 'application/x-datakit+json'
