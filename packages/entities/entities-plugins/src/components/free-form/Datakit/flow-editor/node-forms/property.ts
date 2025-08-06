/**
 * The pattern used to identify properties that have a key in their name.
 * @example
 * kong.ctx.plugin.{key}
 */
export const PROPERTY_KEY_PATTERN = '{key}'

// https://developer.konghq.com/plugins/datakit/#supported-properties
export const KONG_CLIENT_SUPPORTED_PROPERTIES: Record<string, {
  dataType: string
  writable: boolean
  readable: boolean
}> = {
  'kong.client.consumer': {
    dataType: 'object',
    writable: false,
    readable: true,
  },
  'kong.client.consumer_groups': {
    dataType: 'array',
    writable: false,
    readable: true,
  },
  'kong.client.credential': {
    dataType: 'object',
    writable: false,
    readable: true,
  },
  'kong.client.get_identity_realm_source': {
    dataType: 'object',
    writable: false,
    readable: true,
  },
  'kong.client.forwarded_ip': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.client.forwarded_port': {
    dataType: 'number',
    writable: false,
    readable: true,
  },
  'kong.client.ip': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.client.port': {
    dataType: 'number',
    writable: false,
    readable: true,
  },
  'kong.client.protocol': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.request.forwarded_host': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.request.forwarded_port': {
    dataType: 'number',
    writable: false,
    readable: true,
  },
  'kong.request.forwarded_scheme': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.request.port': {
    dataType: 'number',
    writable: false,
    readable: true,
  },
  'kong.response.source': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.router.route': {
    dataType: 'object',
    writable: false,
    readable: true,
  },
  'kong.route_id': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.route_name': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.router.service': {
    dataType: 'object',
    writable: false,
    readable: true,
  },
  'kong.service_name': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.service_id': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.service.response.status': {
    dataType: 'number',
    writable: false,
    readable: true,
  },
  'kong.version': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.node.id': {
    dataType: 'string',
    writable: false,
    readable: true,
  },
  'kong.configuration.{key}': {
    dataType: 'any',
    writable: false,
    readable: true,
  },
  'kong.service.target': {
    dataType: 'string ({host}:{port})',
    writable: true,
    readable: false,
  },
  'kong.service.request_scheme': {
    dataType: 'string ({scheme})',
    writable: true,
    readable: false,
  },
  'kong.ctx.plugin.{key}': {
    dataType: 'any',
    writable: true,
    readable: true,
  },
  'kong.ctx.shared.{key}': {
    dataType: 'any',
    writable: true,
    readable: true,
  },
}

/**
 * List the prefix of properties that have `{key}` in their name.
 * @example
 * kong.ctx.plugin.
 * kong.ctx.shared.
 */
export const PROPERTY_PREFIXES = Object.keys(KONG_CLIENT_SUPPORTED_PROPERTIES)
  .filter((prop) => prop.includes(PROPERTY_KEY_PATTERN))
  .map((prop) => prop.replace(PROPERTY_KEY_PATTERN, ''))


/**
 * Extracts the key from a property string if it exists.
 * @example
 * kong.ctx.plugin.foo -> 'foo'
 * kong.ctx.plugin.{key} -> ''
 * kong.service.target -> undefined
 */
export function extractKeyFromProperty(property?: string | null): string | undefined {
  if (!property || !identifyPropertyHasKey(property)) return undefined
  const prefix = PROPERTY_PREFIXES.find(prefix => property.startsWith(prefix))
  if (!prefix) return undefined
  return property.slice(prefix.length).replace(PROPERTY_KEY_PATTERN, '')
}

/**
 * Returns the property string without the key.
 * @example
 * kong.ctx.plugin.foo -> 'kong.ctx.plugin.'
 * kong.ctx.plugin.{key} -> 'kong.ctx.plugin.'
 * kong.service.target -> 'kong.service.target'
 */
export function getPropertyWithoutKey(property?: string | null): string | null {
  if (!property) return null
  const prefix = PROPERTY_PREFIXES.find(p => property.startsWith(p))
  if (!prefix) return property
  return prefix
}

/**
 * Identifies if a property string has a key.
 * @example
 * kong.ctx.plugin.foo -> true
 * kong.ctx.plugin.{key} -> true
 * kong.service.target -> false
 */
export function identifyPropertyHasKey(property?: string | null): boolean {
  if (!property) return false
  return PROPERTY_PREFIXES.some(prefix => property.startsWith(prefix))
}

/**
 * Resets the property string if it has a key.
 * @example
 * kong.ctx.plugin.foo -> 'kong.ctx.plugin.{key}'
 * kong.ctx.plugin.{key} -> 'kong.ctx.plugin.{key}'
 * kong.service.target -> 'kong.service.target'
 */
export function resetPropertyIfHasKey(property?: string | null): string | null {
  if (!property) return null
  if (!identifyPropertyHasKey(property)) return property
  return getPropertyWithoutKey(property) + PROPERTY_KEY_PATTERN
}

export function isWritableProperty(property?: string | null): boolean {
  if (!property) return false
  const rawProperty = resetPropertyIfHasKey(property)
  if (!rawProperty) return false
  return KONG_CLIENT_SUPPORTED_PROPERTIES[rawProperty]?.writable ?? false
}
