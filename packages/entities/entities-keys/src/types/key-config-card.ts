import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect Key entity config */
export interface KonnectKeyEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager Key entity config */
export interface KongManagerKeyEntityConfig extends KongManagerBaseEntityConfig {}

export interface KeyConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem,
  last_updated: ConfigurationSchemaItem,
  created: ConfigurationSchemaItem,
  set: ConfigurationSchemaItem,
  kid: ConfigurationSchemaItem,
  tags: ConfigurationSchemaItem,
  jwk: ConfigurationSchemaItem,
  pem: ConfigurationSchemaItem,
}
