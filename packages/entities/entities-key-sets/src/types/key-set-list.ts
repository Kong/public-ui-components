import type { RouteLocationRaw } from 'vue-router'
import { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui/entities-shared'

export interface BaseKeySetListConfig {
  /** Route for creating a key set */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a key set */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a key set */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect key list config */
export interface KonnectKeySetListConfig extends KonnectBaseTableConfig, BaseKeySetListConfig {}

/** Kong Manager key list config */
export interface KongManagerKeySetListConfig extends KongManagerBaseTableConfig, BaseKeySetListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string
  name?: string
  kid: string
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
