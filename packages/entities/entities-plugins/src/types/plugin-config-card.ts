import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig } from '@kong-ui-public/entities-shared'

/** Konnect Plugin entity config */
export interface KonnectPluginEntityConfig extends KonnectBaseEntityConfig {
  pluginType: string
}

/** Kong Manager Plugin entity config */
export interface KongManagerPluginEntityConfig extends KongManagerBaseEntityConfig {
  pluginType: string
}
