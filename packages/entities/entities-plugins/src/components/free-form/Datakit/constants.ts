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
