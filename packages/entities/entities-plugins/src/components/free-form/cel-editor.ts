import { shallowRef, watch } from 'vue'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'
import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'

export type PluginCelLanguage = 'expression' | 'condition' | 'acl-rule'

/**
 * The CEL dialect of the plugin field of this kind: every Kong Gateway variable,
 * except plugin state in ACL rules and `default()` in expressible fields.
 * `records` reads the records that value suggestions name.
 */
export const getPluginFieldCelLanguage = (kind: PluginCelLanguage, records: () => CelSubjects): CelLanguage => {
  return defineCelLanguage([
    kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongPrincipal(records), kongContext(),
    kind === 'acl-rule' ? kongAclRule() : kongPluginState(),
    kind === 'expression' ? kongExpressibleField() : kongFallback(),
  ])
}

type Config = KonnectPluginFormConfig | KongManagerPluginFormConfig
/** Rollout policy for language keys explicitly selected by the frontend form. */
export function isPluginCelEnabled(
  language: string,
  config: Config,
  konnectEnabled: boolean,
): language is PluginCelLanguage {
  const enabled = config.app === 'kongManager' ? config.enableCelEditor : konnectEnabled
  if (!enabled) return false
  if (language === 'expression' || language === 'acl-rule') return true
  if (language !== 'condition') return false

  // Gateway 3.14 evaluates condition as ATC. Offer CEL only for known 3.15+ targets.
  const supportedRange = { enterprise: ['3.15'] as [string] }
  if (config.app === 'kongManager') {
    return !!config.gatewayInfo && useGatewayFeatureSupported({ gatewayInfo: config.gatewayInfo, supportedRange })
  }

  const versions = config.dataPlaneVersions
  return !!versions?.length && versions.every(version => useGatewayFeatureSupported({
    gatewayInfo: { edition: 'enterprise', version }, supportedRange,
  }))
}

/** Share an in-flight or successful host lookup across the editors in this form. */
export function useCelSubjectLoader(config: () => Config) {
  const subjects = shallowRef<CelSubjects>({})
  const loader = shallowRef<Config['getCelSubjects']>()
  watch([
    () => config().getCelSubjects,
    () => config().apiBaseUrl,
    () => config().workspace,
    () => {
      const host = config()
      return host.app === 'konnect' ? host.controlPlaneId : undefined
    },
  ], ([load], _, onCleanup) => {
    subjects.value = {}
    let active = true
    onCleanup(() => {
      active = false
    })
    let pending: Promise<CelSubjects> | undefined
    loader.value = load && (() => pending ??= Promise.resolve().then(load).then(records => {
      if (active) subjects.value = records
      return records
    }).catch(error => {
      pending = undefined
      throw error
    }))
  }, { immediate: true, flush: 'sync' })
  return { subjects, loader }
}
