import { getCelFieldKind } from '@kong-ui-public/freeform'
import { useGatewayFeatureSupported } from '@kong-ui-public/entities-shared'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../types'

/**
 * Whether the plugin field at `path` renders the CEL editor instead of its plain
 * input. It needs the `km-plugins-cel-expression-editor` flag (`enabled`) and a
 * field that holds CEL (`condition`, `expressions.*`, ACL rules: see
 * `getCelFieldKind`). Kong Gateway 3.15 made CEL the `condition` engine (3.14 used
 * the ATC router syntax), so in Kong Manager, `condition` also needs Kong Gateway 3.15.
 */
export const shouldRenderCelEditor = (
  path: string,
  enabled: boolean,
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig,
): boolean => {
  const kind = getCelFieldKind(path)
  if (!enabled || !kind) return false
  if (kind !== 'condition' || config.app !== 'kongManager') return true
  return useGatewayFeatureSupported({
    gatewayInfo: (config as KongManagerPluginFormConfig).gatewayInfo,
    supportedRange: { enterprise: ['3.15'] },
  })
}
