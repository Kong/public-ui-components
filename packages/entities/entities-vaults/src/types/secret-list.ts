import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

/** Konnect secret list config */
export interface KonnectSecretListConfig extends KonnectBaseTableConfig {
  /** Route for creating a secret */
  createRoute: RouteLocationRaw
  /** A function that returns the route for editing a secret */
  getEditRoute: (id: string) => RouteLocationRaw
  /**
   * Which vault API the secrets belong to.
   * - 'gateway' (default): Konnect Config Store secrets
   * - 'aiGateway': Kong AI Gateway secrets
   */
  apiType?: 'gateway' | 'aiGateway'
  /** The AI Gateway id. Required when apiType is 'aiGateway'. */
  aiGatewayId?: string
}

export interface SecretEntityRow extends Record<string, any> {
  id: string
  key: string
  value: string
}

