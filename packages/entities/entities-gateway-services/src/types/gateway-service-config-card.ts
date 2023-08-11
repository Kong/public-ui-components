import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect GatewayService entity config */
export interface KonnectGatewayServiceEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager GatewayService entity config */
export interface KongManagerGatewayServiceEntityConfig extends KongManagerBaseEntityConfig {}

export interface GatewayServiceConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  enabled: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  protocol: ConfigurationSchemaItem
  host: ConfigurationSchemaItem
  path: ConfigurationSchemaItem
  port: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
  // advanced fields
  retries: ConfigurationSchemaItem
  connect_timeout: ConfigurationSchemaItem
  write_timeout: ConfigurationSchemaItem
  read_timeout: ConfigurationSchemaItem
  client_certificate: ConfigurationSchemaItem
  ca_certificates: ConfigurationSchemaItem
  tls_verify: ConfigurationSchemaItem
  tls_verify_depth: ConfigurationSchemaItem
}
