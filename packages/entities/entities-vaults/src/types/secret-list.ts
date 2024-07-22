import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

/** Konnect secret list config */
export interface KonnectSecretListConfig extends KonnectBaseTableConfig {
  /** Route for creating a secret */
  createRoute: RouteLocationRaw
  /** A function that returns the route for editing a secret */
  getEditRoute: (id: string) => RouteLocationRaw
}

export interface SecretEntityRow extends Record<string, any> {
  id: string
  key: string
  value: string
}

