import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

type PluginFormsConfig = (KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}

// Konnect + managed-redis FF + Cloud Gateway: hide "+ New Redis" in plugin forms
export function hideNewRedis(config: PluginFormsConfig): boolean {
  return config.app === 'konnect'
    && !!config.isKonnectManagedRedisEnabled
    && config.isCloudGateway === true
}
