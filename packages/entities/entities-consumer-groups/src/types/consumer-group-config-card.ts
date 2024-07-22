import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect ConsumerGroup entity config */
export interface KonnectConsumerGroupEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager ConsumerGroup entity config */
export interface KongManagerConsumerGroupEntityConfig extends KongManagerBaseEntityConfig {}

export interface ConsumerGroupConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}
