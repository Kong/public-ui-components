import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface TokenExchange {
  cache?: {
    /**@default true */
    enabled?: boolean
    ttl?: number
  } | null

  request?: {
    audience?: string[] | null
    scopes?: string[] | null
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

export interface ProofOfPossessionMtlsFromHeader {
  allow_partial_chain?: boolean
  ca_certificates?: string[]
  cert_cache_ttl?: number
  certificate_header_format?: string
  certificate_header_name?: string
  http_proxy_host?: string
  http_proxy_port?: number
  http_timeout?: number
  https_proxy_host?: string
  https_proxy_port?: number
  revocation_check_mode?: string
  secure_source?: boolean
  ssl_verify?: boolean
}

/**
 * The config interface of OIDC above v3.14
 */
export interface OIDCPluginConfig_gte_314 {
  config?: {
    token_exchange?: TokenExchange | null
    proof_of_possession_mtls_from_header?: ProofOfPossessionMtlsFromHeader | null
  }
}

export interface OIDCSchema extends CommonSchemaFields<OIDCPluginConfig_gte_314> {}
