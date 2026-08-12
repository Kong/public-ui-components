import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig } from '@kong-ui-public/entities-shared'

export interface BasePluginConfigCardConfig {
  pluginType: string
  /** A function that returns the route for viewing the plugin's scoped service */
  getServiceViewRoute?: (id: string) => RouteLocationRaw
  /** A function that returns the route for viewing the plugin's scoped route */
  getRouteViewRoute?: (id: string) => RouteLocationRaw
  /** A function that returns the route for viewing the plugin's scoped consumer */
  getConsumerViewRoute?: (id: string) => RouteLocationRaw
  /** A function that returns the route for viewing the plugin's scoped consumer group */
  getConsumerGroupViewRoute?: (id: string) => RouteLocationRaw
}

/** Konnect Plugin entity config */
export interface KonnectPluginEntityConfig extends KonnectBaseEntityConfig, BasePluginConfigCardConfig {}

/** Kong Manager Plugin entity config */
export interface KongManagerPluginEntityConfig extends KongManagerBaseEntityConfig, BasePluginConfigCardConfig {}
