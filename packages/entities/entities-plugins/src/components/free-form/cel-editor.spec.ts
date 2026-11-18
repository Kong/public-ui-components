import { describe, expect, it, vi } from 'vitest'
import { createApp, effectScope, nextTick, reactive, ref, type ComputedRef, type MaybeRef } from 'vue'
import { useGatewayCelKind } from './cel-editor'
import {
  getCelSubjectValues, getCelSuggestions,
  kongAclRule, kongExpressibleField, kongFallback, kongPluginState, type CelKind, type CelPlugin,
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
  const kind = app.runWithContext(() => scope.run(() => useGatewayCelKind(plugins, options))!)
  return { kind, scope }
}

describe('useGatewayCelKind', () => {
  it('follows the Konnect flag and the Kong Manager opt-in', () => {
    const flag = ref(false)
    const { kind } = fromHost(konnect, EXPRESSIBLE, { flag })
    expect(kind.value).toBeUndefined()
    flag.value = true
    expect(kind.value).toBeDefined()
    expect(fromHost(konnect, EXPRESSIBLE).kind.value).toBeUndefined()
    expect(fromHost(undefined, EXPRESSIBLE, { flag: true }).kind.value).toBeUndefined()
    expect(fromHost(manager, EXPRESSIBLE, { flag: true }).kind.value).toBeUndefined()
    expect(fromHost({ ...manager, enableCelEditor: true }, EXPRESSIBLE).kind.value).toBeDefined()
    expect(fromHost(konnect, undefined, { flag: true }).kind.value).toBeUndefined()
  })

  it('requires every target to support the field minimum', () => {
    const konnectKind = (dataPlaneVersions?: string[]) =>
      fromHost({ ...konnect, dataPlaneVersions }, CONDITION, { flag: true, minGatewayVersion: '3.15' }).kind.value
    expect(konnectKind()).toBeUndefined()
    expect(konnectKind([])).toBeUndefined()
    expect(konnectKind(['3.15.0.0', '3.14.0.0'])).toBeUndefined()
    expect(konnectKind(['3.15.0.0', '3.17.0.0'])).toBeDefined()

    const managerKind = (version?: string) => fromHost({
      ...manager, enableCelEditor: true, ...(version && { gatewayInfo: { edition: 'enterprise' as const, version } }),
    }, CONDITION, { minGatewayVersion: '3.15' }).kind.value
    expect(managerKind()).toBeUndefined()
    expect(managerKind('3.14.0.0')).toBeUndefined()
    expect(managerKind('3.15.0.0')).toBeDefined()
  })

  it('offers principal groups and type only when every target declares them', () => {
    const fields = (config: KonnectPluginFormConfig | KongManagerPluginFormConfig) =>
      getCelSuggestions('principal.', fromHost(config, ACL_RULE, { flag: true }).kind.value!).map(s => s.label).sort()
    const base = ['display_name', 'id', 'metadata']
    const extended = ['display_name', 'groups', 'id', 'metadata', 'type']
    const optedIn = { ...manager, enableCelEditor: true }

    expect(fields(konnect)).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.16.0.2', '3.17.0.0'] })).toEqual(base)
    expect(fields({ ...konnect, dataPlaneVersions: ['3.17.0.0-rc.1', '3.17.0.0'] })).toEqual(extended)
    expect(fields({ ...optedIn, gatewayInfo: { edition: 'enterprise', version: '3.15.0.0' } })).toEqual(base)
    expect(fields({ ...optedIn, gatewayInfo: { edition: 'enterprise', version: '3.17.0.0' } })).toEqual(extended)
  })

  it('shares one host lookup, retries a failure and reloads when the scope changes', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ consumers: [{ id: 'first' }] })
      .mockResolvedValueOnce({ consumers: [{ id: 'other' }] })
    const host = reactive<KonnectPluginFormConfig>({ ...konnect, getCelSubjects: load })
    const ids = (kind: ComputedRef<CelKind | undefined>) =>
      getCelSubjectValues(kind.value!, 'consumer-id').map(v => v.value)

    const failed = fromHost(host, ACL_RULE, { flag: true })
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    failed.scope.stop()

    const fields = [fromHost(host, ACL_RULE, { flag: true }), fromHost(host, EXPRESSIBLE, { flag: true })]
    await vi.waitFor(() => expect(fields.map(field => ids(field.kind))).toEqual([['first'], ['first']]))
    expect(load).toHaveBeenCalledTimes(2)

    host.controlPlaneId = 'other'
    await nextTick()
    await vi.waitFor(() => expect(fields.map(field => ids(field.kind))).toEqual([['other'], ['other']]))
    expect(load).toHaveBeenCalledTimes(3)
  })
})
