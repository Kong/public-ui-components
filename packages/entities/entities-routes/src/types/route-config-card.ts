import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'

/** Konnect Route entity config */
export interface KonnectRouteEntityConfig extends KonnectBaseEntityConfig {}

/** Kong Manager Route entity config */
export interface KongManagerRouteEntityConfig extends KongManagerBaseEntityConfig {}

export interface RouteConfigurationSchema {
  // basic fields
  id: ConfigurationSchemaItem,
  name: ConfigurationSchemaItem,
  protocols: ConfigurationSchemaItem,
  service: ConfigurationSchemaItem,
  hosts: ConfigurationSchemaItem,
  methods: ConfigurationSchemaItem,
  paths: ConfigurationSchemaItem,
  headers: ConfigurationSchemaItem,
  strip_path: ConfigurationSchemaItem,
  preserve_host: ConfigurationSchemaItem,
  tags: ConfigurationSchemaItem,
  created_at: ConfigurationSchemaItem,
  updated_at: ConfigurationSchemaItem
  // advanced fields
  snis: ConfigurationSchemaItem,
  https_redirect_status_code: ConfigurationSchemaItem,
  request_buffering: ConfigurationSchemaItem,
  response_buffering: ConfigurationSchemaItem,
  regex_priority: ConfigurationSchemaItem,
  path_handling: ConfigurationSchemaItem,
  destinations: ConfigurationSchemaItem,
  sources: ConfigurationSchemaItem
}
