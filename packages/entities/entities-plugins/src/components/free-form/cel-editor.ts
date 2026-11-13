import { shallowRef, watch } from 'vue'
import { EXPRESSIONS_FIELD, isExpressionFieldSchema } from '@kong-ui-public/freeform'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import type { UnionFieldSchema } from '@kong-ui-public/freeform'
import type { CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

type Config = KonnectPluginFormConfig | KongManagerPluginFormConfig
export type PluginCelFieldKind = 'expression' | 'condition' | 'acl-rule'

export function getPluginCelFieldKind(
  path: string,
  schema: UnionFieldSchema | undefined,
  plugin: string,
  config: Config,
  konnectEnabled: boolean,
): PluginCelFieldKind | undefined {
  const enabled = config.app === 'kongManager' ? config.enableCelEditor : konnectEnabled
  if (!enabled || schema?.type !== 'string') return
  if (path.startsWith(`${EXPRESSIONS_FIELD}.`) && isExpressionFieldSchema(schema)) return 'expression'
  if (plugin === 'acl' && /^config\.(allow|deny)_when\.\d+$/.test(path)) return 'acl-rule'
  if (plugin === 'ai-mcp-proxy' && /^config\.(default_acl\.\d+|tools\.\d+\.acl)\.(allow|deny)_when\.\d+$/.test(path)) return 'acl-rule'
  if (path !== 'condition') return

  // Gateway 3.14 evaluates condition as ATC. Offer CEL only for known 3.15+ targets.
  const supportedRange = { enterprise: ['3.15'] as [string] }
  if (config.app === 'kongManager') {
    if (config.gatewayInfo && useGatewayFeatureSupported({ gatewayInfo: config.gatewayInfo, supportedRange })) return 'condition'
    return
  }

  const versions = config.dataPlaneVersions
  if (versions?.length && versions.every(version => useGatewayFeatureSupported({
    gatewayInfo: { edition: 'enterprise', version }, supportedRange,
  }))) return 'condition'
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
      return host.app === 'konnect' ? host.controlPlaneId : undefined
    },
  ], ([load]) => {
    let pending: Promise<CelSubjects> | undefined
    loader.value = load && (() => pending ??= Promise.resolve().then(load).catch(error => {
      pending = undefined
      throw error
    }))
  }, { immediate: true, flush: 'sync' })
  return loader
}
