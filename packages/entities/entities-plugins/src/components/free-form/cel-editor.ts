import { computed, inject, provide, shallowRef, unref, watch, type MaybeRef } from 'vue'
import { reactiveComputed } from '@vueuse/core'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'
import { FEATURE_FLAGS } from '../../constants'
import { FORMS_CONFIG } from './const'
import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'

export type CelExpressionKind = 'expression' | 'condition' | 'acl-rule'

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

export function useCelInput() {
  const config = inject<Config | undefined>(FORMS_CONFIG, undefined)
  const featureFlag = inject<MaybeRef<boolean>>(FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR, false)
  const enabled = computed(() => config?.app === 'kongManager'
    ? !!config.enableCelEditor
    : config?.app === 'konnect' && unref(featureFlag))

  function getLanguages(kind: CelExpressionKind): CelLanguage[] {
    if (!enabled.value || !config) return []
    // Gateway 3.14 evaluates condition as ATC. Every target must support CEL.
    if (kind === 'condition' && !allTargetsSupport(config, '3.15')) return []

    const load = config.getCelSubjects
    let records: CelSubjects = {}
    void load?.().then(result => {
      records = result
    }).catch(() => {})
    return [getPluginFieldCelLanguage(kind, config, () => config.getCelSubjects === load ? records : {})]
  }

  return { enabled, getLanguages }
}

/** Share an in-flight or successful host lookup across the editors in this form. */
export function useCelSubjectLoader(config: () => Config) {
  const loader = shallowRef<Config['getCelSubjects']>()
  watch([
    () => config().getCelSubjects,
    () => config().apiBaseUrl,
    () => config().workspace,
    () => {
      const host = config()
      return 'aiGatewayId' in host ? host.aiGatewayId : undefined
    },
    () => {
      const host = config()
      return host.app === 'konnect' ? host.controlPlaneId : undefined
    },
  ], ([load], _, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
      loader.value = undefined
    })
    let pending: Promise<CelSubjects> | undefined
    loader.value = load && (() => pending ??= Promise.resolve()
      .then(() => active ? load() : {})
      .then(records => active ? records : {})
      .catch(error => {
        pending = undefined
        throw error
      }))
  }, { immediate: true, flush: 'sync' })
  return loader
}

/** Scope the existing host callback to one mounted configuration form, including direct AI Manager mounts. */
export function provideCelSubjectLoader() {
  const host = inject<Config | undefined>(FORMS_CONFIG, undefined)
  if (!host) return
  const loader = useCelSubjectLoader(() => host)
  provide(FORMS_CONFIG, reactiveComputed(() => ({ ...host, getCelSubjects: loader.value })))
}
