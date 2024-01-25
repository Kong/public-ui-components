import type {
  FilterSchema,
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export interface BaseAssetListConfig {
  /** Route for creating a consumer */
  createRoute: RouteLocationRaw
  /** A boolean to indicate if the paginated endpoint is used when consumerGroupId is provided */
  paginatedEndpoint?: boolean
  /** A function that returns the route for viewing a consumer */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a consumer */
  getEditRoute: (id: string) => RouteLocationRaw

  getCreatePluginRoute: (id: string) => RouteLocationRaw
}

/** Konnect route list config */
export interface KonnectAssetListConfig extends KonnectBaseTableConfig, BaseAssetListConfig {}

/** Kong Manager route list config */
export interface KongManagerAssetListConfig extends KongManagerBaseTableConfig, BaseAssetListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string;
  username: string
  custom_id: string
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
