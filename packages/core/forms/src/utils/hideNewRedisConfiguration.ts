import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

type PluginFormsConfig = (KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}

/**
 * Hide "+ New Redis" in plugin forms when Konnect-managed Redis is available on Cloud Gateway.
 * Non-cloud Konnect (FF on) still shows create >>> inline form. KM/legacy Konnect (FF off) unchanged.
 */
export function shouldHideNewRedisConfiguration(config: PluginFormsConfig): boolean {
  return (
    config.app === 'konnect' &&
    !!config.isKonnectManagedRedisEnabled &&
    config.isCloudGateway === true
  )
}
