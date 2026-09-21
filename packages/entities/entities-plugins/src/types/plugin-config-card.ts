import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig } from '@kong-ui-public/entities-shared'

export interface BasePluginConfigCardConfig {
  pluginType: string
  /**
   * KM-2996 rollout gate. When true, each scoped entity row (service, route, consumer,
   * consumer group) resolves and shows the entity's name as a link to its detail page, with
   * the id as a subtitle, and the row labels drop their "ID" suffix. Defaults to false =
   * current behavior: the bare id, as a button that emits `navigation-click`.
   * Only takes effect alongside `showNameAsLink`, which is what renders the links at all.
   * Remove this flag once the feature is fully rolled out.
   */
  showScopeName?: boolean
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
