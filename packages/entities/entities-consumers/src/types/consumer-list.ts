import type { RouteLocationRaw } from 'vue-router'
import type {
  FilterSchema,
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'

export interface BaseConsumerListConfig {
  /** Current consumer group id if the ConsumerList in nested in the consumers tab on a consumer group detail page */
  consumerGroupId?: string
  /** Current consumer group name if the ConsumerList in nested in the consumers tab on a consumer group detail page */
  consumerGroupName?: string
  /** Route for creating a consumer */
  createRoute: RouteLocationRaw
  /** A boolean to indicate if the paginated endpoint is used when consumerGroupId is provided */
  paginatedEndpoint?: boolean
  /** A function that returns the route for viewing a consumer */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a consumer */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect route list config */
export interface KonnectConsumerListConfig extends KonnectBaseTableConfig, BaseConsumerListConfig {}

/** Kong Manager route list config */
export interface KongManagerConsumerListConfig extends KongManagerBaseTableConfig, BaseConsumerListConfig {
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
