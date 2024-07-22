import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect Certificate entity config */
export interface KonnectCertificateEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager Certificate entity config */
export interface KongManagerCertificateEntityConfig extends KongManagerBaseEntityConfig {}

export interface CACertificateConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
  cert: ConfigurationSchemaItem
  cert_digest: ConfigurationSchemaItem
  metadata: ConfigurationSchemaItem
}

export interface CertificateConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem
  cert: ConfigurationSchemaItem
  key: ConfigurationSchemaItem
  metadata: ConfigurationSchemaItem
  snis: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
  expiry?: ConfigurationSchemaItem // km field only
  issuer?: ConfigurationSchemaItem // km field only
  san_names?: ConfigurationSchemaItem // km field only
  subject?: ConfigurationSchemaItem // km field only
  // advanced fields
  cert_alt: ConfigurationSchemaItem
  key_alt: ConfigurationSchemaItem
}
