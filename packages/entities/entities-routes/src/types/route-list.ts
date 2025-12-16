import type { RouteLocationRaw } from 'vue-router'
import type { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseRouteListConfig {
  /** Current service id if the RouteList in nested in the routes tab on a service detail page */
  serviceId?: string
  /** Route for creating a route */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a route */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a route */
  getEditRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for starting a debug session for a Route */
  getDebugRoute: (id: string) => RouteLocationRaw
}

/** Konnect route list config */
export interface KonnectRouteListConfig extends KonnectBaseTableConfig, BaseRouteListConfig {}

/** Kong Manager route list config */
export interface KongManagerRouteListConfig extends KongManagerBaseTableConfig, BaseRouteListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string
  name: string
}

/** Copy field event payload */
export interface CopyEventPayload {
  /** The entity row */
  entity: EntityRow
  /** The field being copied. If omitted, the entity JSON is being copied. */
  field?: string
  /** The toaster message */
  message: string
}
