import {
  ConfigurationSchemaItem,
  KongManagerBaseEntityConfig,
  KonnectBaseEntityConfig,
} from '@kong-ui-public/entities-shared'

export interface KonnectUpstreamsEntityConfig extends KonnectBaseEntityConfig {}

export interface KongManagerUpstreamsEntityConfig extends KongManagerBaseEntityConfig {}

export interface UpstreamsConfigurationSchema {
  algorithm: ConfigurationSchemaItem
  created_at: ConfigurationSchemaItem
  hash_fallback: ConfigurationSchemaItem
  hash_on: ConfigurationSchemaItem
  hash_on_cookie: ConfigurationSchemaItem
  hash_on_cookie_path: ConfigurationSchemaItem
  hash_on_header: ConfigurationSchemaItem
  hash_on_query_arg: ConfigurationSchemaItem
  hash_on_uri_capture: ConfigurationSchemaItem
  healthchecks: ConfigurationSchemaItem
  id: ConfigurationSchemaItem
  name: ConfigurationSchemaItem
  slots: ConfigurationSchemaItem
  updated_at: ConfigurationSchemaItem
  client_certificate: ConfigurationSchemaItem
  tags: ConfigurationSchemaItem
  hash_fallback_header: ConfigurationSchemaItem
  hash_fallback_query_arg: ConfigurationSchemaItem
  hash_fallback_uri_capture: ConfigurationSchemaItem
  host_header: ConfigurationSchemaItem
  use_srv_name: ConfigurationSchemaItem
}
