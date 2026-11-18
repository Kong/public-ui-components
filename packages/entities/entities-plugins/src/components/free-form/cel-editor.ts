import { shallowRef, watch } from 'vue'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'
import type { CelExpressionKind } from '@kong-ui-public/freeform'
import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'

type Config = KonnectPluginFormConfig | KongManagerPluginFormConfig

function allTargetsSupport(config: Config, minimum: string): boolean {
  const supportedRange = { enterprise: [minimum] as [string] }
  if (config.app === 'kongManager') {
    return !!config.gatewayInfo && useGatewayFeatureSupported({ gatewayInfo: config.gatewayInfo, supportedRange })
  }

  const versions = config.dataPlaneVersions
  return !!versions?.length && versions.every(version => useGatewayFeatureSupported({
    gatewayInfo: { edition: 'enterprise', version }, supportedRange,
  }))
}

/**
 * The CEL dialect of the plugin field of this kind: every Kong Gateway variable,
 * except plugin state in ACL rules and `default()` in expressible fields.
 * `records` reads the records that value suggestions name.
 */
export const getPluginFieldCelLanguage = (kind: CelExpressionKind, config: Config, records: () => CelSubjects): CelLanguage => {
  return defineCelLanguage([
    kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongContext(),
    kongPrincipal(records, { supportsPrincipalGroups: allTargetsSupport(config, '3.17.0.0-rc.1') }),
    kind === 'acl-rule' ? kongAclRule() : kongPluginState(),
    kind === 'expression' ? kongExpressibleField() : kongFallback(),
  ])
}

export function isPluginCelEnabled(config: Config, konnectEnabled: boolean) {
  return config.app === 'kongManager' ? !!config.enableCelEditor : konnectEnabled
}

export function supportsPluginCelKind(language: string, config: Config): language is CelExpressionKind {
  if (language === 'expression' || language === 'acl-rule') return true

  // Gateway 3.14 evaluates condition as ATC. Offer CEL only for known 3.15+ targets.
  return language === 'condition' && allTargetsSupport(config, '3.15')
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
