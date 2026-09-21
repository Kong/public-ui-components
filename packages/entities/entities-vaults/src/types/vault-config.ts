import type { ConfigurationSchemaItem, KongManagerBaseEntityConfig, KonnectBaseEntityConfig } from '@kong-ui-public/entities-shared'

export interface BaseVaultEntityConfig {
  /**
   * Which vault API the component targets.
   * - 'gateway' (default): Kong API Gateway vault API (Konnect / Kong Manager)
   * - 'aiGateway': Kong AI Gateway vault API (/v1/ai-gateways/{aiGatewayId}/vaults)
   */
  apiType?: 'gateway' | 'aiGateway'
  /** The AI Gateway id. Required when apiType is 'aiGateway'. */
  aiGatewayId?: string
}

export interface KonnectVaultEntityConfig extends KonnectBaseEntityConfig, BaseVaultEntityConfig {}

export interface KongManagerVaultEntityConfig extends KongManagerBaseEntityConfig, BaseVaultEntityConfig {}

export interface VaultConfigurationSchema {
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  config: ConfigurationSchemaItem
  description: ConfigurationSchemaItem
  prefix: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}
