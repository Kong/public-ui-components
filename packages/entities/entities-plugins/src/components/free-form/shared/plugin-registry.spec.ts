import { describe, expect, it } from 'vitest'
import { buildPluginConfigRegistry, derivePluginName } from './plugin-registry'

describe('derivePluginName', () => {
  it('converts PascalCase paths to kebab-case plugin names', () => {
    expect(derivePluginName('../plugins/KeyAuth/index.ts')).toBe('key-auth')
    expect(derivePluginName('../plugins/AICustomGuardrail/index.ts')).toBe('ai-custom-guardrail')
    expect(derivePluginName('../plugins/AIMcpProxy/index.ts')).toBe('ai-mcp-proxy')
    expect(derivePluginName('../plugins/ACL/index.ts')).toBe('acl')
    expect(derivePluginName('../plugins/Cors.ts')).toBe('cors')
    expect(derivePluginName('../plugins/Jwt.ts')).toBe('jwt')
    expect(derivePluginName('../plugins/AwsLambda.ts')).toBe('aws-lambda')
    expect(derivePluginName('../plugins/ProxyCacheAdvanced.ts')).toBe('proxy-cache-advanced')
  })
})

describe('buildPluginConfigRegistry', () => {
  it('throws on duplicate plugin config names', () => {
    expect(() => buildPluginConfigRegistry({
      '../plugins/Foo.ts': {},
      '../plugins/Foo/index.ts': {},
    })).toThrow('Duplicate plugin config for "foo"')
  })
})
