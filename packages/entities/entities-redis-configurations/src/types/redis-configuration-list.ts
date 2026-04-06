import type { KonnectBaseTableConfig, KongManagerBaseTableConfig, FilterSchema } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

import type { RedisConfigurationResponse } from './redis-configuration'

export const REDIS_CONFIGURATION_SOURCE = {
  KONNECT_MANAGED: 'konnect-managed',
  SELF_MANAGED: 'self-managed',
} as const

export type RedisConfigurationSource =
  (typeof REDIS_CONFIGURATION_SOURCE)[keyof typeof REDIS_CONFIGURATION_SOURCE]

export interface BaseRedisConfigurationListConfig {
  /** Route for creating a redis configuration */
  createRoute: RouteLocationRaw
  /**
   * A function that returns the route for viewing a redis config
   * Host should safely handle empty ids-by returning a fallback route
   */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a redis configuration */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect redis configuration list config */
export interface KonnectRedisConfigurationListConfig extends KonnectBaseTableConfig, BaseRedisConfigurationListConfig {
  /** Enables managed Konnect Redis behavior in list flows */
  isKonnectManagedRedisEnabled?: boolean
  /**
   * Enables managed-Konnect UI copy styling only
   * If omitted, list UI falls back to `isKonnectManagedRedisEnabled`
   */
  useKonnectManagedRedisUi?: boolean
  /** Whether the selected CP is a Cloud Gateway. When false, Redis UI falls back to legacy flow */
  isCloudGateway?: boolean
  /** Optional CP geo used when calling Konnect Cloud Gateways APIs (eg. us, eu) */
  controlPlaneGeo?: string
  /** Base URL for Konnect Cloud Gateways API (add-ons list/delete) */
  cloudGatewaysApiBaseUrl?: string
}

/** Kong Manager redis configuration list config */
export interface KongManagerRedisConfigurationListConfig extends KongManagerBaseTableConfig, BaseRedisConfigurationListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

/** Table row */
export interface EntityRow extends Record<string, any> {
  id: string
  name: string
  /**
   * Set only when the list is combined (Konnect + isKonnectManagedRedisEnabled).
   * Used to: show "Self-managed Redis" vs "Konnect-managed Redis" in the Type column,
   * hide Edit for konnect-managed rows, and choose which API to call on delete.
   */
  source?: RedisConfigurationSource
  /**
   * The Koko partial payload. Set on every row when the list is combined so the Type
   * column can read Redis type from it; otherwise the row itself is the partial.
   */
  partial?: RedisConfigurationResponse
  /**
   * Set only when this row is linked to a Cloud Gateways managed-cache add-on (Konnect).
   * Used when deleting: we call the add-ons API with addOn.id instead of the partial URL.
   */
  addOn?: ManagedCacheAddOn
}

export interface ManagedCacheAddOn {
  id: string
  name?: string
  owner?: {
    control_plane_id?: string
  }
  config?: {
    kind?: string
    state_metadata?: {
      cache_config_id?: string
    }
  }
  // Fallback fields optional for payload compatibility
  attributes?: {
    kind?: string
    state_metadata?: {
      cache_config_id?: string
    }
  }
  state_metadata?: {
    cache_config_id?: string
  }
  state?: string
  created_at?: string | number
}

export interface CopyEventPayload {
  /** The entity row */
  entity: EntityRow
  /** The field being copied. If omitted, the entity JSON is being copied. */
  field?: string
  /** The toaster message */
  message: string
}
