import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchema, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect ConsumerGroup entity config */
export interface KonnectConsumerGroupEntityConfig extends KonnectBaseEntityConfig { }

/** Kong Manager ConsumerGroup entity config */
export interface KongManagerConsumerGroupEntityConfig extends KongManagerBaseEntityConfig { }

export interface ConsumerGroupConfigurationSchema extends ConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}
