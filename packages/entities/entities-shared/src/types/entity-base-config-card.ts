import type { KonnectConfig, KongManagerConfig } from './index'

/**
 * These entity strings are used for generating terraform scripts.
 * Only add entity types that are supported by terraform. Use '_' instead of '-'.
 * DO NOT MODIFY THE VALUES OF THESE STRINGS.
 */
export enum SupportedEntityType {
  CaCertificate = 'ca_certificate',
  Certificate = 'certificate',
  Consumer = 'consumer',
  ConsumerGroup = 'consumer_group',
  GatewayService = 'service',
  Key = 'key',
  KeySet = 'set',
  Plugin = 'plugin',
  Route = 'route',
  SNI = 'sni',
  Upstream = 'upstream',
  Target = 'target',
  Vault = 'vault',
  RedisConfiguration = 'redis_configuration', // todo(zehao): not sure
  // Use this for any entity type that is not supported by terraform
  // If entityType is 'other' terraform scripts will not be available
  // Note: This is currently only supported by EntityBaseForm not EntityBaseConfigCard!!
  Other = 'other',
}

export const SupportedEntityTypesArray = Object.values(SupportedEntityType)

export interface BaseEntityConfig {
  /** the ID of the entity */
  entityId: string
}

/** Konnect base form config */
export interface KonnectBaseEntityConfig extends KonnectConfig, BaseEntityConfig { }

/** Kong Manager base form config */
export interface KongManagerBaseEntityConfig extends KongManagerConfig, BaseEntityConfig { }

export enum ConfigurationSchemaType {
  ID = 'id',
  IdArray = 'id-array',
  Text = 'plain-text', // default
  Date = 'date',
  Redacted = 'redacted',
  RedactedArray = 'redacted-array',
  Json = 'json',
  JsonArray = 'json-array',
  BadgeTag = 'badge-tag',
  CopyBadge = 'copy-badge',
  BadgeStatus = 'badge-status',
  BadgeMethod = 'badge-method',
  LinkInternal = 'link-internal',
  LinkExternal = 'link-external',
}

export enum ConfigurationSchemaSection {
  Basic = 'basic',
  Advanced = 'advanced', // default
  Plugin = 'plugin',
}

export interface ConfigurationSchemaItem {
  // entry label and tooltip if label has one
  label?: string
  tooltip?: string
  // determines what component should be used to render the value
  type?: ConfigurationSchemaType
  // determines what order the entries are displayed in
  order?: number
  // determines whether or not to render the entry
  hidden?: boolean
  // determines which section the entry is displayed in
  section?: ConfigurationSchemaSection
  // if true, the entry will be rendered even if not provided in the response object
  forceShow?: boolean
}

export interface ConfigurationSchema {
  [key: string]: ConfigurationSchemaItem
}

export interface PluginConfigurationSchemaItem extends Omit<ConfigurationSchemaItem, 'section'> { }

export interface PluginConfigurationSchema {
  [key: string]: PluginConfigurationSchemaItem
}

export interface RecordItem extends ConfigurationSchemaItem {
  key: string
  value: any
}

export interface DefaultCommonFieldsConfigurationSchema {
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  enabled: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
}

export interface ComponentAttrsData {
  tag: string
  attrs?: Record<string, any>
  childAttrs?: Record<string, any>
  text?: string
  additionalComponent?: string
}
