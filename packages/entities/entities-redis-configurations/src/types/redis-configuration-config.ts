import type {
  KonnectBaseEntityConfig,
  KongManagerBaseEntityConfig,
} from '@kong-ui-public/entities-shared'

export interface BsseRedisConfigurationEntityConfig {
  /**
   * Show/hide cloud authentication configuration fields
   */
  cloudAuthAvailable?: boolean
}
/** Konnect redis configuration entity config */
export interface KonnectRedisConfigurationEntityConfig extends KonnectBaseEntityConfig, BsseRedisConfigurationEntityConfig { }

/** Kong Manager redis configuration entity config */
export interface KongManagerRedisConfigurationEntityConfig extends KongManagerBaseEntityConfig, BsseRedisConfigurationEntityConfig { }
