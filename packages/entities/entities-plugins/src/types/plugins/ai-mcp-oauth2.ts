import type { CommonSchemaFields } from './shared'

export interface TokenExchange {
  cache: {
    /** @default true */
    enabled: boolean
    /** @default 3600 */
    ttl: number
  }

  /** @default client_secret_basic */
  client_auth: 'client_secret_basic' | 'client_secret_post' | 'inherit' | 'none'

  /** @default false */
  enabled: boolean

  request: {
    /** @default none */
    actor_token_source: 'config' | 'header' | 'none'

    /** @default urn:ietf:params:oauth:token-type:access_token */
    actor_token_type: string

    /** @default null */
    audience: string[] | null

    /** @default urn:ietf:params:oauth:token-type:access_token */
    requested_token_type: string

    /** @default urn:ietf:params:oauth:token-type:access_token */
    subject_token_type: string

    /** @default null */
    scopes: string[] | null
  }
}

export interface AIMCPOauth2Config_gte_314 {
  config?: {
    token_exchange?: TokenExchange | null
  }
}

export interface AIMCPOauth2Schema extends CommonSchemaFields<AIMCPOauth2Config_gte_314> {}
