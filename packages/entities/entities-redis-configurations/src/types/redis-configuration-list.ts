import type { KonnectBaseTableConfig, KongManagerBaseTableConfig, FilterSchema } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export interface BaseRedisConfigurationListConfig {
  /** Route for creating a redis configuration */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a redis configuration */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a redis configuration */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect redis configuration list config */
export interface KonnectRedisConfigurationListConfig extends KonnectBaseTableConfig, BaseRedisConfigurationListConfig { }

/** Kong Manager redis configuration list config */
export interface KongManagerRedisConfigurationListConfig extends KongManagerBaseTableConfig, BaseRedisConfigurationListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string
  name: string
}
