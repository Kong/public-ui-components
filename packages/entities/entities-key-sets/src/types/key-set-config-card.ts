import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui/entities-shared'

/** Konnect KeySet entity config */
export interface KonnectKeySetEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager KeySet entity config */
export interface KongManagerKeySetEntityConfig extends KongManagerBaseEntityConfig {}

export interface KeySetConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem,
  last_updated: ConfigurationSchemaItem,
  created: ConfigurationSchemaItem,
  tags: ConfigurationSchemaItem,
}
