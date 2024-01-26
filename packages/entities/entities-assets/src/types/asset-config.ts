import type { ConfigurationSchemaItem, KongManagerBaseEntityConfig, KonnectBaseEntityConfig } from '@kong-ui-public/entities-shared'

export interface KonnectAssetEntityConfig extends KonnectBaseEntityConfig {}

export interface KongManagerAssetEntityConfig extends KongManagerBaseEntityConfig {}

export interface AssetConfigurationSchema {
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  url: ConfigurationSchemaItem
  metadata: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}
