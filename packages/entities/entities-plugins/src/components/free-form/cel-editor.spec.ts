import { describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { getPluginCelFieldKind, useCelSubjectLoader } from './cel-editor'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

const konnect: KonnectPluginFormConfig = { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp' }
const manager: KongManagerPluginFormConfig = { app: 'kongManager', apiBaseUrl: '', workspace: 'default' }
const string = { type: 'string' } as const
const twin = { ...string, expressible_kong_type: 'integer' } as const

describe('plugin CEL rendering', () => {
  it('matches only expression twins and ACL rows for the effective plugin', () => {
    for (const [plugin, path] of [
      ['acl', 'config.deny_when.0'],
      ['ai-mcp-proxy', 'config.default_acl.1.allow_when.0'],
      ['ai-mcp-proxy', 'config.tools.0.acl.deny_when.2'],
    ]) {
      expect(getPluginCelFieldKind(path, string, plugin, konnect, true)).toBe('acl-rule')
      expect(getPluginCelFieldKind(path, string, plugin, konnect, false)).toBeUndefined()
      expect(getPluginCelFieldKind(path, string, 'custom-plugin', konnect, true)).toBeUndefined()
    }
    for (const path of ['config.notifications.deny_when.0', 'config.allow.0', 'config.allow_when']) {
      expect(getPluginCelFieldKind(path, string, 'acl', konnect, true)).toBeUndefined()
    }
    expect(getPluginCelFieldKind('expressions.minute', twin, 'rate-limiting', konnect, true)).toBe('expression')
    expect(getPluginCelFieldKind('expressions.minute', string, 'custom-plugin', konnect, true)).toBeUndefined()
  })

  it('requires every Konnect data plane to support CEL for condition', () => {
    const condition = (dataPlaneVersions?: string[]) =>
      getPluginCelFieldKind('condition', string, 'acl', { ...konnect, dataPlaneVersions }, true)
    expect(condition()).toBeUndefined()
    expect(condition([])).toBeUndefined()
    expect(condition(['3.15.0.0', '3.14.0.0'])).toBeUndefined()
    expect(condition(['3.15.0.0', '3.17.0.0'])).toBe('condition')
  })

  it('lets Kong Manager opt in independently and requires known Gateway support for condition', () => {
    expect(getPluginCelFieldKind('config.allow_when.0', string, 'acl', manager, true)).toBeUndefined()
    const optedIn = { ...manager, enableCelEditor: true }
    expect(getPluginCelFieldKind('config.allow_when.0', string, 'acl', optedIn, false)).toBe('acl-rule')
    expect(getPluginCelFieldKind('condition', string, 'acl', optedIn, false)).toBeUndefined()
    const condition = (version: string) => getPluginCelFieldKind('condition', string, 'acl', {
      ...optedIn, gatewayInfo: { edition: 'enterprise', version },
    }, false)
    expect(condition('3.14.0.0')).toBeUndefined()
    expect(condition('3.15.0.0')).toBe('condition')
  })
})

describe('CEL record lookups', () => {
  it('calls only the host loader, shares the result and invalidates it when scope or permissions change', async () => {
    const host = shallowRef(konnect)
    const scope = effectScope()
    const loader = scope.run(() => useCelSubjectLoader(() => host.value))!
    expect(loader.value).toBeUndefined()
    const records = { consumerGroups: [{ id: 'g', name: 'team' }] }
    const load = vi.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue(records)
    host.value = { ...konnect, getCelSubjects: load }
    expect(load).not.toHaveBeenCalled()
    await expect(loader.value!()).rejects.toThrow('unavailable')
    const pending = loader.value!()
    expect(loader.value!()).toBe(pending)
    await expect(pending).resolves.toEqual(records)
    host.value = { ...host.value, controlPlaneId: 'other' }
    expect(loader.value!()).not.toBe(pending)
    await expect(loader.value!()).resolves.toEqual(records)
    expect(load).toHaveBeenCalledTimes(3)
    host.value = konnect
    expect(loader.value).toBeUndefined()
    scope.stop()
  })
})
