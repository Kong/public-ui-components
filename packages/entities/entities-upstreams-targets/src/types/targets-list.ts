import type { RouteLocationRaw } from 'vue-router'
import { KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'
import { EntityRow } from './index'

export interface BaseTargetsListConfig {
  /** Route for creating a target */
  // Optional because a form could open in a modal or in a new page
  // TODO: can be removed when we switch to using modal all the way
  createRoute?: RouteLocationRaw
}

/** Konnect targets list config */
export interface KonnectTargetsListConfig extends KonnectBaseTableConfig, BaseTargetsListConfig {
  upstreamId: string
}

/** Kong Manager targets list config */
export interface KongManagerTargetsListConfig extends KongManagerBaseTableConfig, BaseTargetsListConfig {
  upstreamId: string
  canMarkHealthy: (target: EntityRow) => (boolean | Promise<boolean>)
  canMarkUnhealthy: (target: EntityRow) => (boolean | Promise<boolean>)
}
