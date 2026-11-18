import { describe, expect, it, vi } from 'vitest'
import { createApp, effectScope, nextTick, reactive, ref, type ComputedRef, type MaybeRef } from 'vue'
import { useGatewayCelLanguage } from './cel-editor'
import {
  getCelCallables, getCelHint, getCelSubjectValues, getCelSuggestions,
  kongAclRule, kongExpressibleField, kongFallback, kongPluginState, type CelLanguage, type CelPlugin,
} from '@kong-ui-public/monaco-editor/languages/cel'
import { FEATURE_FLAGS } from '../../constants'
import { FORMS_CONFIG } from './const'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

vi.mock('monaco-editor', () => ({}))

const konnect: KonnectPluginFormConfig = { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp' }
const manager: KongManagerPluginFormConfig = { app: 'kongManager', apiBaseUrl: '', workspace: 'default' }
const CONDITION = [kongPluginState(), kongFallback()]
const ACL_RULE = [kongAclRule(), kongFallback()]
const EXPRESSIBLE = [kongPluginState(), kongExpressibleField()]

function fromHost(
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig | undefined,
  plugins: readonly CelPlugin[] | undefined,
  options: { flag?: MaybeRef<boolean>, minGatewayVersion?: string } = {},
) {
  const app = createApp({})
  if (config) app.provide(FORMS_CONFIG, config)
  if (options.flag !== undefined) app.provide(FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR, options.flag)
  const scope = effectScope()
  const language = app.runWithContext(() => scope.run(() => useGatewayCelLanguage(plugins, options))!)
  return { language, scope }
}

describe('useGatewayCelLanguage', () => {
  it('follows the Konnect flag and the Kong Manager opt-in', () => {
    const flag = ref(false)
    const { language } = fromHost(konnect, EXPRESSIBLE, { flag })
    expect(language.value).toBeUndefined()
    flag.value = true
    expect(language.value).toBeDefined()
    expect(fromHost(konnect, EXPRESSIBLE).language.value).toBeUndefined()
    expect(fromHost(undefined, EXPRESSIBLE, { flag: true }).language.value).toBeUndefined()
    expect(fromHost(manager, EXPRESSIBLE, { flag: true }).language.value).toBeUndefined()
    expect(fromHost({ ...manager, enableCelEditor: true }, EXPRESSIBLE).language.value).toBeDefined()
    expect(fromHost(konnect, undefined, { flag: true }).language.value).toBeUndefined()
  })

  it('requires every target to support the field minimum', () => {
    const konnectLanguage = (dataPlaneVersions?: string[]) =>
      fromHost({ ...konnect, dataPlaneVersions }, CONDITION, { flag: true, minGatewayVersion: '3.15' }).language.value
    expect(konnectLanguage()).toBeUndefined()
    expect(konnectLanguage([])).toBeUndefined()
    expect(konnectLanguage(['3.15.0.0', '3.14.0.0'])).toBeUndefined()
    expect(konnectLanguage(['3.15.0.0', '3.17.0.0'])).toBeDefined()

    const managerLanguage = (version?: string) => fromHost({
      ...manager, enableCelEditor: true, ...(version && { gatewayInfo: { edition: 'enterprise' as const, version } }),
    }, CONDITION, { minGatewayVersion: '3.15' }).language.value
    expect(managerLanguage()).toBeUndefined()
    expect(managerLanguage('3.14.0.0')).toBeUndefined()
    expect(managerLanguage('3.15.0.0')).toBeDefined()
  })

  it('offers principal groups and type only when every target declares them', () => {
    const fields = (config: KonnectPluginFormConfig | KongManagerPluginFormConfig) =>
      getCelSuggestions('principal.', fromHost(config, ACL_RULE, { flag: true }).language.value!).map(s => s.label).sort()
    const base = ['display_name', 'id', 'metadata']
    const extended = ['display_name', 'groups', 'id', 'metadata', 'type']
    const optedIn = { ...manager, enableCelEditor: true }

    expect(fields(konnect)).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.16.0.2', '3.17.0.0'] })).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.17.0.0-rc.1', '3.17.0.0'] })).toEqual(extended)
    expect(fields({ ...optedIn, gatewayInfo: { edition: 'enterprise', version: '3.15.0.0' } })).toEqual(base)
    expect(fields({ ...optedIn, gatewayInfo: { edition: 'enterprise', version: '3.17.0.0' } })).toEqual(extended)
  })

  it('adds only the features each field registers', () => {
    const dialect = (plugins: readonly CelPlugin[]) => {
      const language = fromHost(konnect, plugins, { flag: true }).language.value!
      return {
        pluginState: 'plugins' in language.variables,
        fallback: getCelCallables(undefined, language).some(callable => callable.name === 'default'),
        hints: [getCelHint('plugins.key_auth.is_matched', language)?.kind, getCelHint('default(1, 2)', language)?.kind],
      }
    }
    expect(dialect(CONDITION)).toEqual({ pluginState: true, fallback: true, hints: [undefined, undefined] })
    expect(dialect(EXPRESSIBLE)).toEqual({ pluginState: true, fallback: false, hints: [undefined, 'default'] })
    expect(dialect(ACL_RULE)).toEqual({ pluginState: false, fallback: true, hints: ['plugin-state', undefined] })
  })

  it('shares one host lookup, retries a failure and reloads when the scope changes', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ consumers: [{ id: 'first' }] })
      .mockResolvedValueOnce({ consumers: [{ id: 'other' }] })
    const host = reactive<KonnectPluginFormConfig>({ ...konnect, getCelSubjects: load })
    const ids = (language: ComputedRef<CelLanguage | undefined>) =>
      getCelSubjectValues(language.value!, 'consumer-id').map(v => v.value)

    const failed = fromHost(host, ACL_RULE, { flag: true })
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    failed.scope.stop()

    const fields = [fromHost(host, ACL_RULE, { flag: true }), fromHost(host, EXPRESSIBLE, { flag: true })]
    await vi.waitFor(() => expect(fields.map(field => ids(field.language))).toEqual([['first'], ['first']]))
    expect(load).toHaveBeenCalledTimes(2)

    host.controlPlaneId = 'other'
    await nextTick()
    await vi.waitFor(() => expect(fields.map(field => ids(field.language))).toEqual([['other'], ['other']]))
    expect(load).toHaveBeenCalledTimes(3)
  })
})
