import type { RouteLocationRaw } from 'vue-router'
import type { KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export type CredentialPlugins = 'acls' | 'basic-auth' | 'key-auth' | 'key-auth-enc' | 'oauth2' | 'hmac-auth' | 'jwt'

export interface BaseConsumerCredentialListConfig {
  /** Consumer ID */
  consumerId: string
  /** Credential plugin name */
  plugin: CredentialPlugins
  /** Route for creating a consumer credential */
  createRoute: RouteLocationRaw
  /** A function that returns the route for editing a consumer credential */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect consumer credential list config */
export interface KonnectConsumerCredentialListConfig extends KonnectBaseTableConfig, BaseConsumerCredentialListConfig {}

/** Kong Manager consumer credential list config */
export interface KongManagerConsumerCredentialListConfig extends KongManagerBaseTableConfig, BaseConsumerCredentialListConfig {}

export interface EntityRow extends Record<string, any> {
  id: string
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
