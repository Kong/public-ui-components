import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'

/**
 * Replace the `{controlPlaneId}` and `/{workspace}` placeholders in an endpoint template with
 * values from the plugin form config.
 */
export function resolvePluginConfigUrl(
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig,
  template: string,
): string {
  let url = `${config.apiBaseUrl}${template}`

  if (config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, config.controlPlaneId || '')
  }

  return url.replace(/\/{workspace}/gi, config.workspace ? `/${config.workspace}` : '')
}
