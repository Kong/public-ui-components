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
export interface KonnectRedisConfigurationEntityConfig extends KonnectBaseEntityConfig, BsseRedisConfigurationEntityConfig {
  /** FF (same as list). With `isCloudGateway: true`, enables Konnect-managed Redis detail (add-on + partial strip) */
  isKonnectManagedRedisEnabled?: boolean
  /** Must be `true`, not omitted on Cloud Gateway CPss so detail matches list; if omitted will have legacy partial-only card */
  isCloudGateway?: boolean
  cloudGatewaysApiBaseUrl?: string
  controlPlaneGeo?: string
}

/** Kong Manager redis configuration entity config */
export interface KongManagerRedisConfigurationEntityConfig extends KongManagerBaseEntityConfig, BsseRedisConfigurationEntityConfig { }
