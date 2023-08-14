import type { RouteLocationRaw } from 'vue-router'
import { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseSniListConfig {
  /** Route for creating an SNI */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing an SNI */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing an SNI */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect SNI list config */
export interface KonnectSniListConfig extends KonnectBaseTableConfig, BaseSniListConfig {}

/** Kong Manager SNI list config */
export interface KongManagerSniListConfig extends KongManagerBaseTableConfig, BaseSniListConfig {
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
