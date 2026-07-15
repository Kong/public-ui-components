import type { RouteLocationRaw } from 'vue-router'
import type { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseVaultListConfig {
  /** Route for creating a vault */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a vault */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a vault */
  getEditRoute: (id: string) => RouteLocationRaw
  /**
   * Which vault API the component targets.
   * - 'gateway' (default): Kong API Gateway vault API (Konnect / Kong Manager)
   * - 'aiGateway': Kong AI Gateway vault API (/v1/ai-gateways/{aiGatewayId}/vaults)
   */
  apiType?: 'gateway' | 'aiGateway'
  /** The AI Gateway id. Required when apiType is 'aiGateway'. */
  aiGatewayId?: string
}

/** Konnect vault list config */
export interface KonnectVaultListConfig extends KonnectBaseTableConfig, BaseVaultListConfig {}

/** Kong Manager vault list config */
export interface KongManagerVaultListConfig extends KongManagerBaseTableConfig, BaseVaultListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

export interface EntityRow extends Record<string, any> {
  id: string
  name: string
  prefix: string
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
