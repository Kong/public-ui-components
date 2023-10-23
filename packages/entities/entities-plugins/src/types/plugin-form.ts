import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface BasePluginFormConfig {
  /** Route for creating a plugin */
  createRoute: RouteLocationRaw
  /** Consumer to bind the Plugin to on creation if Consumer Credential */
  consumerId?: string
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
  consumer_id: string
}

export interface PluginFormState {
  /** Form fields */
  fields: PluginFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}
