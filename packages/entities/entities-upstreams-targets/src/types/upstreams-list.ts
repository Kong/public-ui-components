import type { RouteLocationRaw } from 'vue-router'
import { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseUpstreamsListConfig {
  /** Route for creating an upstream */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing an upstream */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing an upstream */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect upstreams list config */
export interface KonnectUpstreamsListConfig extends KonnectBaseTableConfig, BaseUpstreamsListConfig {}

/** Kong Manager upstreams list config */
export interface KongManagerUpstreamsListConfig extends KongManagerBaseTableConfig, BaseUpstreamsListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}
