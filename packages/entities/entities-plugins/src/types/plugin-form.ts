import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface BasePluginFormConfig {
  /** A function that returns the route for creating a plugin */
  getCreateRoute: (id: string) => RouteLocationRaw
  /** Entity to bind the Plugin to on creation */
  entityId?: string
}

/** Konnect Plugin form config */
export interface KonnectPluginFormConfig extends BasePluginFormConfig, KonnectBaseFormConfig {
  /** Route for creating a custom plugin */
  createCustomRoute: RouteLocationRaw
  /** A function that returns the route for editing a custom plugin */
  getCustomEditRoute: (id: string) => RouteLocationRaw
}

/** Kong Manager Plugin form config */
export interface KongManagerPluginFormConfig extends BasePluginFormConfig, KongManagerBaseFormConfig {}

export interface PluginFormFields {
  name: string
  tags: string
  entity_id: string
}

export interface PluginFormState {
  /** Form fields */
  fields: PluginFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}
