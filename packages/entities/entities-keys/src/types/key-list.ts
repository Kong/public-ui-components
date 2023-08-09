import type { RouteLocationRaw } from 'vue-router'
import { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseKeyListConfig {
  /** Current key set id if the KeyList in nested in the keys tab on a key set detail page */
  keySetId?: string
  /** Route for creating a key */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a key */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a key */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect key list config */
export interface KonnectKeyListConfig extends KonnectBaseTableConfig, BaseKeyListConfig {}

/** Kong Manager key list config */
export interface KongManagerKeyListConfig extends KongManagerBaseTableConfig, BaseKeyListConfig {
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
