import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

type PluginFormsConfig = (KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}

/** Hide "+ New Redis" for Konnect + FF + Cloud Gateway.
 * Non-cloud + FF still shows create. */
export function shouldHideNewRedis(config: PluginFormsConfig): boolean {
  return (
    config.app === 'konnect' &&
    !!config.isKonnectManagedRedisEnabled &&
    config.isCloudGateway === true
  )
}

/** Konnect + FF + non-cloud: inline managed create, else KM/legacy modal */
export function shouldInlineRedisCreate(config: PluginFormsConfig): boolean {
  return (
    config.app === 'konnect' &&
    !!config.isKonnectManagedRedisEnabled &&
    config.isCloudGateway === false
  )
}
