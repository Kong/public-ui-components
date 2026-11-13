import { describe, expect, it } from 'vitest'
import { defineCelLanguage } from './catalog'
import { getCelHint } from './hints'
import { kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet, kongPluginState, kongPrincipal, kongRoute, kongService } from './kong'

const gateway = [kongHttp(), kongNet(), kongConsumer(), kongConsumerGroup(), kongRoute(), kongService(), kongPrincipal(), kongContext()]
const full = defineCelLanguage([...gateway, kongPluginState(), kongFallback()])
const acl = defineCelLanguage([...gateway, kongAclRule(), kongFallback()])
const expressible = defineCelLanguage([...gateway, kongPluginState(), kongExpressibleField()])

describe('getCelHint', () => {
  it('accepts declared variables, map keys, methods, macro variables and literals', () => {
    for (const expression of [
      'consumer.username == "alice"',
      'http.headers.x_tenant == "a" && http.path.startsWith("/v1")',
      'principal.groups.exists(g, g.id == "x" && g.type == "group")',
      'has(principal.metadata.team) && principal.metadata.team == "ai"',
      'has(kong.ctx.shared.tier) && kong.ctx.shared.tier == "gold"',
      'http.headers["x_tenant"] == null || http.headers.x_tenant == "a"',
      'default("gold" in consumer_group.names, false)',
      'plugins.key_auth.is_matched',
      '"consumers.id" == route.name // consumers here is text',
      'net.dst.port == 443 ? "a" : "b"',
      '{"tier": 1}.tier == 1',
      'http.headers.exists(service, service.startsWith("x-"))',
      'consumer.tags.exists(services, services == "a")',
    ]) {
      expect(getCelHint(expression, full), expression).toBeUndefined()
    }
  })

  it('suggests the declared root for a near miss', () => {
    expect(getCelHint('consumers.id == "1"', full)).toEqual({ kind: 'alias', typed: 'consumers', expected: 'consumer' })
    expect(getCelHint('"a" in consumer_groups.names', full)).toEqual({ kind: 'alias', typed: 'consumer_groups', expected: 'consumer_group' })
  })

  it('names a field the Gateway does not declare', () => {
    expect(getCelHint('principal.name == "x"', full)).toEqual({ kind: 'unknown-field', field: 'principal.name' })
    expect(getCelHint('net.src.address == "x"', full)).toEqual({ kind: 'unknown-field', field: 'net.src.address' })
    expect(getCelHint('plugins.key_auth.enabled', full)).toEqual({ kind: 'unknown-field', field: 'plugins.key_auth.enabled' })
  })

  it('checks the fields of a macro variable against its type', () => {
    expect(getCelHint('principal.groups.exists(g, g.name == "x")', full))
      .toEqual({ kind: 'unknown-member', field: 'g.name', base: 'g', type: '{ id, type }' })
    // A map macro ranges over keys, so `service` is a string here, not the global.
    expect(getCelHint('http.headers.exists(service, service.id == "x")', full))
      .toEqual({ kind: 'unknown-member', field: 'service.id', base: 'service', type: 'string' })
  })

  it('asks for lowercase header names with _ for -', () => {
    expect(getCelHint('http.headers.X_Tenant == "a"', full)).toEqual({ kind: 'header-name', typed: 'X_Tenant', expected: 'x_tenant' })
    expect(getCelHint('http.headers_list["X-Tenant"].size() > 0', full)).toEqual({ kind: 'header-name', typed: 'X-Tenant', expected: 'x_tenant' })
  })

  it('asks for has() before reading a key of kong.ctx.shared or principal.metadata', () => {
    expect(getCelHint('kong.ctx.shared.tier == "gold"', full)).toEqual({ kind: 'unguarded', field: 'kong.ctx.shared.tier' })
    expect(getCelHint('principal.metadata.team == "ai" && has(principal.metadata.org)', full)).toEqual({ kind: 'unguarded', field: 'principal.metadata.team' })
  })

  it('rejects default() in an expressible field', () => {
    expect(getCelHint('default(int(http.headers.x_limit), 10)', expressible)).toEqual({ kind: 'default' })
  })

  it('asks for == instead of a single =', () => {
    expect(getCelHint('consumer.id = "c-1"', full)).toEqual({ kind: 'assignment' })
    expect(getCelHint('net.dst.port >= 443 && net.dst.port <= 8443 && consumer.id != "a"', full)).toBeUndefined()
    expect(getCelHint('route.name == "a=b"', full)).toBeUndefined()
  })

  it('rejects plugin state in ACL rules', () => {
    expect(getCelHint('plugins.key_auth.is_matched', acl)).toEqual({ kind: 'plugin-state' })
  })
})
