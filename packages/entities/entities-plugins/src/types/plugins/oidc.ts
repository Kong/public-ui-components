import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface TokenExchange {
  cache?: {
    /**@default true */
    enabled?: boolean
    ttl?: number
  } | null

  request?: {
    empty_audience?: boolean
    empty_scopes?: boolean
  } | null

  subject_token_issuers?: Array<{
    conditions?: {
      has_audiences?: string[]
      has_scopes?: string[]
      missing_audiences?: string[]
      missing_scopes?: string[]
    } | null

    issuer?: string
  }> | null
}

/**
 * The config interface of OIDC above v3.14
 */
export interface OIDCPluginConfig_gte_314 {
  config?: {
    token_exchange?: TokenExchange | null
  }
}

export interface OIDCSchema extends CommonSchemaFields<OIDCPluginConfig_gte_314> {}
