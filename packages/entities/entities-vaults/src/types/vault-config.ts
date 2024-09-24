import type { ConfigurationSchemaItem, KongManagerBaseEntityConfig, ConfigurationSchema, KonnectBaseEntityConfig } from '@kong-ui-public/entities-shared'

export interface KonnectVaultEntityConfig extends KonnectBaseEntityConfig { }

export interface KongManagerVaultEntityConfig extends KongManagerBaseEntityConfig { }

export interface VaultConfigurationSchema extends ConfigurationSchema {
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  config: ConfigurationSchemaItem
  description: ConfigurationSchemaItem
  prefix: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}
