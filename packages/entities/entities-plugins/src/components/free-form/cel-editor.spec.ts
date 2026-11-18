import { describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { getPluginFieldCelLanguage, isPluginCelEnabled, supportsPluginCelKind, useCelSubjectLoader } from './cel-editor'
import { getCelCallables, getCelHint, getCelSuggestions } from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelExpressionKind } from '@kong-ui-public/freeform'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

const konnect: KonnectPluginFormConfig = { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp' }
const manager: KongManagerPluginFormConfig = { app: 'kongManager', apiBaseUrl: '', workspace: 'default' }

describe('plugin CEL rendering', () => {
  it('gates explicitly selected languages without matching field paths or plugin names', () => {
    expect(isPluginCelEnabled(konnect, true)).toBe(true)
    expect(isPluginCelEnabled(konnect, false)).toBe(false)
    for (const language of ['expression', 'acl-rule']) {
      expect(supportsPluginCelKind(language, konnect)).toBe(true)
    }
    expect(supportsPluginCelKind('config.allow_when.0', konnect)).toBe(false)
    expect(supportsPluginCelKind('unknown-language', konnect)).toBe(false)
  })

  it('requires every Konnect data plane to support CEL for condition', () => {
    const condition = (dataPlaneVersions?: string[]) =>
      supportsPluginCelKind('condition', { ...konnect, dataPlaneVersions })
    expect(condition()).toBe(false)
    expect(condition([])).toBe(false)
    expect(condition(['3.15.0.0', '3.14.0.0'])).toBe(false)
    expect(condition(['3.15.0.0', '3.17.0.0'])).toBe(true)
  })

  it('lets Kong Manager opt in independently and requires known Gateway support for condition', () => {
    expect(isPluginCelEnabled(manager, true)).toBe(false)
    const optedIn = { ...manager, enableCelEditor: true }
    expect(isPluginCelEnabled(optedIn, false)).toBe(true)
    expect(supportsPluginCelKind('condition', optedIn)).toBe(false)
    const condition = (version: string) => supportsPluginCelKind('condition', {
      ...optedIn, gatewayInfo: { edition: 'enterprise', version },
    })
    expect(condition('3.14.0.0')).toBe(false)
    expect(condition('3.15.0.0')).toBe(true)
  })
})

describe('CEL record lookups', () => {
  it('discards pending records after the host scope changes or the form unmounts', async () => {
    let resolveRecords!: (records: { consumers: Array<{ id: string }> }) => void
    const host = shallowRef<KonnectPluginFormConfig>({ ...konnect, getCelSubjects: () => new Promise(resolve => {
      resolveRecords = resolve
    }) })
    const scope = effectScope()
    const { loader, subjects } = scope.run(() => useCelSubjectLoader(() => host.value))!
    const old = loader.value!()
    await Promise.resolve()
    host.value = { ...host.value, controlPlaneId: 'other' }
    resolveRecords({ consumers: [{ id: 'old' }] })
    await old
    expect(subjects.value).toEqual({})

    const next = loader.value!()
    await Promise.resolve()
    scope.stop()
    resolveRecords({ consumers: [{ id: 'unmounted' }] })
    await next
    expect(subjects.value).toEqual({})
  })

  it('calls only the host loader, shares the result and invalidates it when scope or permissions change', async () => {
    const host = shallowRef(konnect)
    const scope = effectScope()
    const { loader, subjects } = scope.run(() => useCelSubjectLoader(() => host.value))!
    expect(loader.value).toBeUndefined()
    const records = { consumerGroups: [{ id: 'g', name: 'team' }] }
    const load = vi.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue(records)
    host.value = { ...konnect, getCelSubjects: load }
    expect(load).not.toHaveBeenCalled()
    await expect(loader.value!()).rejects.toThrow('unavailable')
    const pending = loader.value!()
    expect(loader.value!()).toBe(pending)
    await expect(pending).resolves.toEqual(records)
    expect(subjects.value).toEqual(records)
    host.value = { ...host.value, controlPlaneId: 'other' }
    expect(loader.value!()).not.toBe(pending)
    await expect(loader.value!()).resolves.toEqual(records)
    expect(load).toHaveBeenCalledTimes(3)
    host.value = konnect
    expect(loader.value).toBeUndefined()
    expect(subjects.value).toEqual({})
    scope.stop()
  })
})

vi.mock('monaco-editor', () => ({}))

const dialect = (kind: CelExpressionKind) => {
  const language = getPluginFieldCelLanguage(kind, konnect, () => ({}))
  return {
    pluginState: 'plugins' in language.variables,
    fallback: getCelCallables(undefined, language).some(callable => callable.name === 'default'),
    hints: [getCelHint('plugins.key_auth.is_matched', language)?.kind, getCelHint('default(1, 2)', language)?.kind],
  }
}

describe('getPluginFieldCelLanguage', () => {
  it('offers principal groups and type only when every target declares them', () => {
    const fields = (config: KonnectPluginFormConfig | KongManagerPluginFormConfig) =>
      getCelSuggestions('principal.', getPluginFieldCelLanguage('acl-rule', config, () => ({}))).map(s => s.label).sort()
    const base = ['display_name', 'id', 'metadata']
    const extended = ['display_name', 'groups', 'id', 'metadata', 'type']

    expect(fields(konnect)).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.16.0.2', '3.17.0.0'] })).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.17.0.0-rc.1', '3.17.0.0'] })).toEqual(extended)
    expect(fields({ ...manager, gatewayInfo: { edition: 'enterprise', version: '3.15.0.0' } })).toEqual(base)
    expect(fields({ ...manager, gatewayInfo: { edition: 'enterprise', version: '3.17.0.0' } })).toEqual(extended)
  })

  it('rejects plugin state only in ACL rules, and default() only in expressible fields', () => {
    expect(dialect('condition')).toEqual({ pluginState: true, fallback: true, hints: [undefined, undefined] })
    expect(dialect('expression')).toEqual({ pluginState: true, fallback: false, hints: [undefined, 'default'] })
    expect(dialect('acl-rule')).toEqual({ pluginState: false, fallback: true, hints: ['plugin-state', undefined] })
  })
})
