import { computed, inject, shallowRef, toValue, unref, watch } from 'vue'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter } from 'vue'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import {
  defineCelLanguage, kongConsumer, kongConsumerGroup, kongContext, kongHttp, kongNet, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelPlugin, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'
import { FEATURE_FLAGS } from '../../constants'
import { FORMS_CONFIG } from './const'

type Config = KonnectPluginFormConfig | KongManagerPluginFormConfig
type LoadSubjects = NonNullable<Config['getCelSubjects']>

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

// One lookup per host callback and scope, shared by every CEL field that reads it.
const lookups = new WeakMap<LoadSubjects, { scope: string, records: Promise<CelSubjects> }>()

function lookupSubjects(load: LoadSubjects, scope: string): Promise<CelSubjects> {
  const cached = lookups.get(load)
  if (cached?.scope === scope) return cached.records
  const records = load()
  lookups.set(load, { scope, records })
  records.catch(() => {
    if (lookups.get(load)?.records === records) lookups.delete(load)
  })
  return records
}

/**
 * The Gateway CEL dialect of one field: the variables every Gateway expression
 * reads, plus the field's own `plugins`. Undefined while the host has the editor
 * off, the field passes no plugins, or a target is older than `minGatewayVersion`.
 */
export function useGatewayCelLanguage(
  plugins: MaybeRefOrGetter<readonly CelPlugin[] | undefined>,
  { minGatewayVersion }: { minGatewayVersion?: string } = {},
): ComputedRef<CelLanguage | undefined> {
  const config = inject<Config | undefined>(FORMS_CONFIG, undefined)
  const flag = inject<MaybeRef<boolean>>(FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR, false)
  const subjects = shallowRef<CelSubjects>({})
  const records = () => subjects.value

  const language = computed(() => {
    const local = toValue(plugins)
    if (!config || !local) return
    const enabled = config.app === 'kongManager' ? !!config.enableCelEditor : !!unref(flag)
    if (!enabled || (minGatewayVersion && !allTargetsSupport(config, minGatewayVersion))) return
    return defineCelLanguage([
      kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongContext(),
      kongPrincipal(records, { supportsPrincipalGroups: allTargetsSupport(config, '3.17.0.0-rc.1') }),
      ...local,
    ])
  })

  // Load the records once this field shows a CEL editor. Switching the scope
  // that the host callback reads discards the old records.
  watch([
    () => !!language.value,
    () => config?.getCelSubjects,
    () => config && [
      config.apiBaseUrl,
      config.workspace,
      config.app === 'konnect' ? config.controlPlaneId : '',
      'aiGatewayId' in config ? config.aiGatewayId : '',
    ].join('\n'),
  ], ([shown, load, scope], _, onCleanup) => {
    subjects.value = {}
    if (!shown || !load || scope === undefined) return
    let active = true
    onCleanup(() => {
      active = false
    })
    // A failed lookup leaves value suggestions empty; the next field retries it.
    lookupSubjects(load, scope).then((result) => {
      if (active) subjects.value = result
    }).catch(() => {})
  }, { immediate: true })

  return language
}
