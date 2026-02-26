import type { CommonSchemaFields } from '../../types/plugins/shared'

/**
 * The config interface of OIDC above v3.14
 */
export interface OIDCPluginConfig_gte_314 {
  config?: {
    token_exchange: {
      subject_token_issuers?: Array<{
        conditions?: {
          has_audiences?: string[]
          has_scopes?: string[]
          missing_audiences?: string[]
          missing_scopes?: string[]
        }

        issuer?: string
      }>
    }
  }
}

export interface OIDCSchema extends CommonSchemaFields<OIDCPluginConfig_gte_314> {}
