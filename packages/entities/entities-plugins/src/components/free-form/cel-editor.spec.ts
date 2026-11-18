import { describe, expect, it, vi } from 'vitest'
import { createApp, effectScope, ref, shallowRef, type MaybeRef } from 'vue'
import { getPluginFieldCelLanguage, useCelInput, useCelSubjectLoader, type CelExpressionKind } from './cel-editor'
import { getCelCallables, getCelHint, getCelSuggestions } from '@kong-ui-public/monaco-editor/languages/cel'
import { FEATURE_FLAGS } from '../../constants'
import { FORMS_CONFIG } from './const'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

const konnect: KonnectPluginFormConfig = { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp' }
const manager: KongManagerPluginFormConfig = { app: 'kongManager', apiBaseUrl: '', workspace: 'default' }

function fromHost(config?: KonnectPluginFormConfig | KongManagerPluginFormConfig, flag?: MaybeRef<boolean>) {
  const app = createApp({})
  if (config) app.provide(FORMS_CONFIG, config)
  if (flag !== undefined) app.provide(FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR, flag)
  return app.runWithContext(useCelInput)
}

describe('useCelInput', () => {
  it('reads the rollout from the host and responds when its flag changes', () => {
    const flag = ref(false)
    const { enabled, getLanguages } = fromHost(konnect, flag)
    expect(enabled.value).toBe(false)
    expect(getLanguages('expression')).toEqual([])
    flag.value = true
    expect(enabled.value).toBe(true)
    expect(getLanguages('expression')).toHaveLength(1)
    expect(getLanguages('acl-rule')).toHaveLength(1)
    expect(fromHost(konnect).enabled.value).toBe(false)
    expect(fromHost(undefined, true).enabled.value).toBe(false)
  })

  it('requires every Konnect target to support CEL for condition', () => {
    const languages = (dataPlaneVersions?: string[]) =>
      fromHost({ ...konnect, dataPlaneVersions }, true).getLanguages('condition')
    expect(languages()).toEqual([])
    expect(languages([])).toEqual([])
    expect(languages(['3.15.0.0', '3.14.0.0'])).toEqual([])
    expect(languages(['3.15.0.0', '3.17.0.0'])).toHaveLength(1)
  })

  it('lets Kong Manager opt in independently and requires known Gateway support for condition', () => {
    expect(fromHost(manager, true).enabled.value).toBe(false)
    const optedIn = { ...manager, enableCelEditor: true }
    expect(fromHost(optedIn).enabled.value).toBe(true)
    expect(fromHost(optedIn).getLanguages('condition')).toEqual([])
    const languages = (version: string) => fromHost({
      ...optedIn, gatewayInfo: { edition: 'enterprise', version },
    }).getLanguages('condition')
    expect(languages('3.14.0.0')).toEqual([])
    expect(languages('3.15.0.0')).toHaveLength(1)
  })
})

describe('CEL record lookups', () => {
  it('discards pending records after the host scope changes or the form unmounts', async () => {
    let resolveRecords!: (records: { consumers: Array<{ id: string }> }) => void
    const host = shallowRef<KonnectPluginFormConfig>({ ...konnect, getCelSubjects: () => new Promise(resolve => {
      resolveRecords = resolve
    }) })
    const scope = effectScope()
    const loader = scope.run(() => useCelSubjectLoader(() => host.value))!
    const old = loader.value!()
    await Promise.resolve()
    host.value = { ...host.value, controlPlaneId: 'other' }
    resolveRecords({ consumers: [{ id: 'old' }] })
    await expect(old).resolves.toEqual({})

    const next = loader.value!()
    await Promise.resolve()
    scope.stop()
    resolveRecords({ consumers: [{ id: 'unmounted' }] })
    await expect(next).resolves.toEqual({})
    expect(loader.value).toBeUndefined()
  })

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
