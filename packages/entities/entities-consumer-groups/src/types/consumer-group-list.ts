import type { RouteLocationRaw } from 'vue-router'
import {
  FilterSchema,
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'

export interface BaseConsumerGroupListConfig {
  /** Current consumer id if the ConsumerGroupList in nested in the groups tab on a consumer detail page */
  consumerId?: string
  /** Current consumer username if the ConsumerGroupList in nested in the groups tab on a consumer detail page */
  consumerUsername?: string
  /** Route for creating a consumer group */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a consumer group */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a consumer group */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect route list config */
export interface KonnectConsumerGroupListConfig extends KonnectBaseTableConfig, BaseConsumerGroupListConfig {}

/** Kong Manager route list config */
export interface KongManagerConsumerGroupListConfig
  extends KongManagerBaseTableConfig,
  BaseConsumerGroupListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string
  name: string
  consumers: number
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
