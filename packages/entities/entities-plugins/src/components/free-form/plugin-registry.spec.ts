import { describe, expect, it } from 'vitest'
import CommonForm from './components/CommonForm.vue'
import ACLForm from './plugins/acl/ACLForm.vue'
import { buildPluginConfigRegistry, derivePluginName, getFreeFormComponent } from './plugin-registry'

describe('derivePluginName', () => {
  it('converts paths to plugin names', () => {
    expect(derivePluginName('./plugins/key-auth/index.ts')).toBe('key-auth')
    expect(derivePluginName('./plugins/ai-custom-guardrail/index.ts')).toBe('ai-custom-guardrail')
    expect(derivePluginName('./plugins/ai-mcp-proxy/index.ts')).toBe('ai-mcp-proxy')
    expect(derivePluginName('./plugins/acl/index.ts')).toBe('acl')
    expect(derivePluginName('./plugins/cors.ts')).toBe('cors')
    expect(derivePluginName('./plugins/jwt.ts')).toBe('jwt')
    expect(derivePluginName('./plugins/aws-lambda.ts')).toBe('aws-lambda')
    expect(derivePluginName('./plugins/proxy-cache-advanced.ts')).toBe('proxy-cache-advanced')
  })
})

describe('buildPluginConfigRegistry', () => {
  it('throws on duplicate plugin config names', () => {
    expect(() => buildPluginConfigRegistry({
      './plugins/foo.ts': {},
      './plugins/foo/index.ts': {},
    })).toThrow('Duplicate plugin config for "foo"')
  })
})

describe('getFreeFormComponent', () => {
  it('returns the custom component of a registered plugin', () => {
    expect(getFreeFormComponent('acl')).toBe(ACLForm)
  })

  it('returns CommonForm for a registered plugin without a custom component', () => {
    expect(getFreeFormComponent('cors')).toBe(CommonForm)
  })

  it('returns CommonForm for a plugin without a config', () => {
    expect(getFreeFormComponent('my-custom-plugin')).toBe(CommonForm)
  })
})
