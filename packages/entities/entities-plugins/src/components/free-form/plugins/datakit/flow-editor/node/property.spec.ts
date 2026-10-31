import { describe, expect, it } from 'vitest'
import {
  KONG_CLIENT_SUPPORTED_PROPERTIES,
  extractKeyFromProperty,
  getPropertyWithoutKey,
  identifyPropertyHasKey,
  isReadableProperty,
  isWritableProperty,
  resetPropertyIfHasKey,
} from './property'

/**
 * Properties supported by the backend, from kong-ee `kong/plugins/datakit/nodes/property.lua`
 * (`add_getter` / `add_setter` / `add_namespace`). Namespaces use the `{key}` placeholder.
 */
const BACKEND_PROPERTIES: Record<string, { readable: boolean, writable: boolean }> = {
  'kong.client.consumer': { readable: true, writable: true },
  'kong.client.consumer_groups': { readable: true, writable: false },
  'kong.client.credential': { readable: true, writable: false },
  'kong.client.forwarded_ip': { readable: true, writable: false },
  'kong.client.forwarded_port': { readable: true, writable: false },
  'kong.client.identity_realm_source': { readable: true, writable: false },
  'kong.client.ip': { readable: true, writable: false },
  'kong.client.port': { readable: true, writable: false },
  'kong.client.principal': { readable: true, writable: false },
  'kong.client.principal.{key}': { readable: true, writable: false },
  'kong.client.protocol': { readable: true, writable: false },
  'kong.configuration.{key}': { readable: true, writable: false },
  'kong.ctx.plugin.{key}': { readable: true, writable: true },
  'kong.ctx.shared.{key}': { readable: true, writable: true },
  'kong.nginx.subsystem': { readable: true, writable: false },
  'kong.node.id': { readable: true, writable: false },
  'kong.node.memory_stats': { readable: true, writable: false },
  'kong.request.forwarded_host': { readable: true, writable: false },
  'kong.request.forwarded_port': { readable: true, writable: false },
  'kong.request.forwarded_scheme': { readable: true, writable: false },
  'kong.request.port': { readable: true, writable: false },
  'kong.response.source': { readable: true, writable: false },
  'kong.response.status': { readable: false, writable: true },
  'kong.route_id': { readable: true, writable: false },
  'kong.route_name': { readable: true, writable: false },
  'kong.router.route': { readable: true, writable: false },
  'kong.router.service': { readable: true, writable: false },
  'kong.service.request.scheme': { readable: false, writable: true },
  'kong.service.response.status': { readable: true, writable: false },
  'kong.service.target': { readable: false, writable: true },
  'kong.service.upstream': { readable: false, writable: true },
  'kong.service_id': { readable: true, writable: false },
  'kong.service_name': { readable: true, writable: false },
  'kong.version': { readable: true, writable: false },
}

describe('Datakit properties', () => {
  // The UI may offer a subset of the backend properties, but never one the backend rejects
  it.each(Object.entries(KONG_CLIENT_SUPPORTED_PROPERTIES))('%s is supported by the backend', (name, { readable, writable }) => {
    const backend = BACKEND_PROPERTIES[name]

    expect(backend, `"${name}" is not a backend property`).toBeDefined()
    if (readable) expect(backend.readable).toBe(true)
    if (writable) expect(backend.writable).toBe(true)
  })

  describe('properties with a key', () => {
    it.each([
      ['kong.ctx.plugin.foo', true, 'foo', 'kong.ctx.plugin.', 'kong.ctx.plugin.{key}'],
      ['kong.ctx.plugin.{key}', true, '', 'kong.ctx.plugin.', 'kong.ctx.plugin.{key}'],
      ['kong.ctx.shared.a.b', true, 'a.b', 'kong.ctx.shared.', 'kong.ctx.shared.{key}'],
      ['kong.service.target', false, undefined, 'kong.service.target', 'kong.service.target'],
    ])('%s', (property, hasKey, key, withoutKey, reset) => {
      expect(identifyPropertyHasKey(property)).toBe(hasKey)
      expect(extractKeyFromProperty(property)).toBe(key)
      expect(getPropertyWithoutKey(property)).toBe(withoutKey)
      expect(resetPropertyIfHasKey(property)).toBe(reset)
    })

    it.each([null, undefined, ''])('handles an empty property (%s)', (property) => {
      expect(identifyPropertyHasKey(property)).toBe(false)
      expect(extractKeyFromProperty(property)).toBeUndefined()
      expect(getPropertyWithoutKey(property)).toBeNull()
      expect(resetPropertyIfHasKey(property)).toBeNull()
    })
  })

  describe('readable and writable', () => {
    it.each([
      ['kong.client.ip', true, false],
      ['kong.service.target', false, true],
      ['kong.ctx.shared.foo', true, true],
      ['kong.configuration.log_level', true, false],
      ['kong.unknown', false, false],
      [null, false, false],
    ])('%s', (property, readable, writable) => {
      expect(isReadableProperty(property)).toBe(readable)
      expect(isWritableProperty(property)).toBe(writable)
    })
  })
})
