import type { RouteLocationRaw } from 'vue-router'
import type { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseGatewayServiceListConfig {
  /** Whether to show the belonged control plane column */
  showControlPlaneColumn?: boolean
  /** route for creating a Gateway Service */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a Gateway Service */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a Gateway Service */
  getEditRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for the belonged control plane */
  getControlPlaneRoute?: (id: string) => RouteLocationRaw
  /** A function that returns the route for starting a debug session for a Gateway Service */
  getDebugRoute: (id: string) => RouteLocationRaw
}

/** Konnect GatewayService list config */
export interface KonnectGatewayServiceListConfig extends KonnectBaseTableConfig, BaseGatewayServiceListConfig {}

/** Kong Manager GatewayService list config */
export interface KongManagerGatewayServiceListConfig extends KongManagerBaseTableConfig, BaseGatewayServiceListConfig {
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
