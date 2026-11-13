import { describe, expect, it } from 'vitest'
import {
  formatCelType, getCelCallables, getCelCallFrames, getCelDescription, getCelFields, getCelGlobals, getCelLocals, getCelScope, resolveCelChain,
} from './catalog'

const full = { pluginState: true, expressible: false }
const acl = { pluginState: false, expressible: false }
const none = new Map()
const typeOf = (chain: string, scope = full) => {
  const type = resolveCelChain(chain, none, scope)
  return type && formatCelType(type)
}

describe('getCelScope', () => {
  it('rejects plugin state only in ACL rules', () => {
    expect(getCelScope('condition')).toEqual(full)
    expect(getCelScope('expressions.custom_key')).toEqual({ pluginState: true, expressible: true })
    expect(getCelScope('config.allow_when.0')).toEqual(acl)
    expect(getCelScope('config.default_acl.1.deny_when.0')).toEqual(acl)
    expect(getCelScope('config.tools.0.acl.allow_when.2')).toEqual(acl)
  })
})

describe('global types', () => {
  it('declares the Gateway roots, with plugins only where plugin state is in scope', () => {
    expect(Object.keys(getCelGlobals(full))).toEqual(['http', 'net', 'consumer', 'consumer_group', 'route', 'service', 'principal', 'kong', 'plugins'])
    expect(Object.keys(getCelGlobals(acl))).not.toContain('plugins')
  })

  it('types each variable as the Gateway supplies it', () => {
    expect(typeOf('http.method')).toBe('string')
    expect(typeOf('http.path_segments')).toBe('list<string>')
    expect(typeOf('http.headers')).toBe('map<string, string | null>')
    expect(typeOf('http.headers.x_tenant')).toBe('string | null')
    expect(typeOf('http.queries_list')).toBe('map<string, list<string> | null>')
    expect(typeOf('net.tls.sni')).toBe('string | null')
    expect(typeOf('net.dst.port')).toBe('int')
    expect(typeOf('consumer.username')).toBe('string | null')
    expect(typeOf('consumer_group.names')).toBe('list<string> | null')
    expect(typeOf('principal.groups')).toBe('list<{ id, type }> | null')
    expect(typeOf('principal.metadata.team')).toBe('dyn')
    expect(typeOf('kong.ctx.shared')).toBe('map<string, dyn>')
    expect(typeOf('plugins.key_auth.is_matched')).toBe('bool | null')
    expect(typeOf('plugins.key_auth.priority')).toBe('int | null')
  })

  it('names nothing for undeclared fields', () => {
    expect(typeOf('consumer.name')).toBeUndefined()
    expect(typeOf('principal.name')).toBeUndefined()
    expect(typeOf('plugins.key_auth.enabled')).toBeUndefined()
    expect(typeOf('plugins', acl)).toBeUndefined()
    expect(typeOf('http.method.length')).toBeUndefined()
  })
})

describe('getCelFields', () => {
  it('lists record fields', () => {
    const fields = (chain: string, presenceOnly = false) => getCelFields(resolveCelChain(chain, none, full)!, presenceOnly).map(([name]) => name)
    expect(fields('net')).toEqual(['protocol', 'tls', 'src', 'dst'])
    expect(fields('principal')).toEqual(['id', 'display_name', 'type', 'metadata', 'groups'])
    expect(fields('plugins.key_auth')).toEqual(['is_matched', 'priority', 'access_has_executed'])
    // has() can only test map keys, so namespaces offer the paths to a map.
    expect(fields('http', true)).toEqual(['headers', 'headers_list', 'queries', 'queries_list'])
    expect(fields('kong', true)).toEqual(['ctx'])
    expect(fields('http.headers')).toEqual([])
  })
})

describe('getCelDescription', () => {
  it('describes globals from the Kong Gateway reference', () => {
    expect(getCelDescription('http.path')).toBe('The normalized request path, without the query string.')
    expect(getCelDescription('http.headers.x_tenant')).toBe('The first value of the header, or null when it is absent.')
    expect(getCelDescription('plugins.key_auth.priority')).toBe('The priority of the plugin. Null when the plugin does not match.')
    expect(getCelDescription('net')).toBeUndefined()
    expect(getCelDescription('principal.groups')).toContain('Only AI Gateway data planes load the groups')
  })
})

describe('getCelCallables', () => {
  it('offers methods by type', () => {
    const names = (chain?: string) => getCelCallables(chain ? resolveCelChain(chain, none, full) : undefined).map(c => c.name)
    expect(names()).toEqual(['has', 'matches', 'size'])
    // default() is for conditions and ACL rules; an expressible field falls back to its config value.
    expect(getCelCallables(undefined, full).map(c => c.name)).toEqual(['has', 'matches', 'size', 'default'])
    expect(getCelCallables(undefined, { pluginState: true, expressible: true }).map(c => c.name)).toEqual(['has', 'matches', 'size'])
    expect(names('consumer.tags')).toEqual(['all', 'exists', 'map', 'filter', 'size'])
    expect(names('http.path')).toContain('startsWith')
    expect(names('principal.groups')).toContain('exists')
    expect(names('net.src.port')).toEqual([])
    expect(names('net')).toEqual([])
    expect(getCelCallables(resolveCelChain('http.headers', none, full)).find(c => c.name === 'all')?.parameters).toEqual(['key', 'predicate'])
  })
})

describe('getCelCallFrames', () => {
  it('tracks open calls, arguments and macro variables', () => {
    expect(getCelCallFrames('principal.groups.exists(g, ')).toEqual([
      { name: 'exists', receiver: 'principal.groups', method: true, argument: 1, start: 23, binding: 'g' },
    ])
    expect(getCelCallFrames('http.path.startsWith("(", ')[0]).toMatchObject({ name: 'startsWith', receiver: 'http.path', argument: 1 })
    expect(getCelCallFrames('size(x) == 1')).toEqual([])
  })
})

describe('getCelLocals', () => {
  const locals = (before: string, scope = full) =>
    Object.fromEntries([...getCelLocals(before, scope)].map(([name, type]) => [name, formatCelType(type)]))

  it('types a macro variable as a list item or a map key', () => {
    expect(locals('principal.groups.exists(g, ')).toEqual({ g: '{ id, type }' })
    expect(locals('consumer.tags.all(tag, ')).toEqual({ tag: 'string' })
    expect(locals('http.headers.map(service, ')).toEqual({ service: 'string' })
    expect(locals('http.queries_list.exists(k, ')).toEqual({ k: 'string' })
  })

  it('resolves nested macros through outer variables', () => {
    expect(locals('http.headers_list.exists(k, http.headers_list[k].exists(v, ')).toEqual({ k: 'string', v: 'dyn' })
    expect(locals('principal.groups.exists(g, [g.id].exists(id, ')).toEqual({ g: '{ id, type }', id: 'dyn' })
  })

  it('has no variable before the first argument ends, or after the macro closes', () => {
    expect(locals('principal.groups.exists(g')).toEqual({})
    expect(locals('principal.groups.exists(g, g.id == "a") && ')).toEqual({})
  })
})
