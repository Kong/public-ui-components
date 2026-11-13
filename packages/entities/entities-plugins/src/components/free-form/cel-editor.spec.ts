import { describe, expect, it } from 'vitest'
import { shouldRenderCelEditor } from './cel-editor'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

const konnect = { app: 'konnect' } as KonnectPluginFormConfig
const kongManager = (version: string) => ({ app: 'kongManager', gatewayInfo: { edition: 'enterprise', version } }) as KongManagerPluginFormConfig

const CEL_FIELDS = [
  'condition',
  'expressions.minute',
  'expressions.limits.0',
  'config.allow_when.0',
  'config.default_acl.1.deny_when.0',
  'config.tools.0.acl.allow_when.2',
]

describe('shouldRenderCelEditor', () => {
  it('keeps every plain input without the flag', () => {
    for (const path of CEL_FIELDS) expect(shouldRenderCelEditor(path, false, konnect), path).toBe(false)
  })

  it('renders the CEL editor only for fields that hold CEL', () => {
    for (const path of CEL_FIELDS) expect(shouldRenderCelEditor(path, true, konnect), path).toBe(true)
    // Group names, the rule arrays themselves, and other config fields keep their inputs.
    for (const path of ['config.allow.0', 'config.allow_when', 'config.minute', 'name']) {
      expect(shouldRenderCelEditor(path, true, konnect), path).toBe(false)
    }
  })

  it('renders condition as CEL only where the Gateway evaluates it as CEL', () => {
    expect(shouldRenderCelEditor('condition', true, kongManager('3.14.0.0'))).toBe(false)
    expect(shouldRenderCelEditor('condition', true, kongManager('3.15.0.0'))).toBe(true)
    // The other CEL fields do not depend on the condition engine.
    expect(shouldRenderCelEditor('config.allow_when.0', true, kongManager('3.14.0.0'))).toBe(true)
    expect(shouldRenderCelEditor('expressions.minute', true, kongManager('3.14.0.0'))).toBe(true)
  })
})
