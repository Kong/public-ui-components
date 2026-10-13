import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

type PluginFormsConfig = (KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isCloudGateway?: boolean
}

// Konnect Cloud Gateway: hide "+ New Redis" in plugin forms
export function hideNewRedis(config: PluginFormsConfig): boolean {
  return config.app === 'konnect' && config.isCloudGateway === true
}
