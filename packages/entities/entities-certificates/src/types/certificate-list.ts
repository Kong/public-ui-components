import type { RouteLocationRaw } from 'vue-router'
import { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

export interface BaseCertificateListConfig {
  /** Route for creating a Certificate */
  createRoute: RouteLocationRaw
  /** Route for creating an SNI */
  getCreateSniRoute?: (id: string) => RouteLocationRaw
  /** A function that returns the route for viewing a route */
  getViewRoute: (id: string) => RouteLocationRaw
  /** A function that returns the route for editing a route */
  getEditRoute: (id: string) => RouteLocationRaw
}

/** Konnect Certificate list config */
export interface KonnectCertificateListConfig extends KonnectBaseTableConfig, BaseCertificateListConfig {}

/** Kong Manager Certificate list config */
export interface KongManagerCertificateListConfig extends KongManagerBaseTableConfig, BaseCertificateListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
}

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
