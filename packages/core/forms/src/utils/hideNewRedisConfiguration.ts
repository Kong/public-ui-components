import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

type PluginFormsConfig = (KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isKonnectManagedRedisEnabled?: boolean
}

// Konnect + managed-redis FF: hide inline "+ New Redis" in plugin forms
export function shouldHideNewRedisConfiguration(config: PluginFormsConfig): boolean {
  return config.app === 'konnect' && !!config.isKonnectManagedRedisEnabled
}
