import type { OIDCSchema, TokenExchange, ProofOfPossessionMtlsFromHeader } from '../../types/plugins/oidc'
import { isEqual } from 'lodash-es'

export function resetEmptyTokenExchange(config?: { token_exchange?: TokenExchange | null }) {

  // Non-3.14 version, skip transformation
  if (!config) return
  if (!config.token_exchange) {
    return config
  }

  // Reset request.audience to null if they are empty arrays or undefined
  if (
    Array.isArray(config.token_exchange.request?.audience) && config.token_exchange.request.audience.length === 0
    || config.token_exchange.request && !config.token_exchange.request.audience
  ) {
    config.token_exchange.request.audience = null
  }

  // Reset request.scopes to null if they are empty arrays or undefined
  if (
    Array.isArray(config.token_exchange.request?.scopes) && config.token_exchange.request.scopes.length === 0
    || config.token_exchange.request && !config.token_exchange.request.scopes
  ) {
    config.token_exchange.request.scopes = null
  }

  const emptyTokenExchanges: TokenExchange[] = [
    {
      cache: {
        enabled: true,
      },
      request: {
        audience: null,
        scopes: null,
        empty_audience: false,
        empty_scopes: false,
      },
      subject_token_issuers: null,
    },
    {
      cache: {
        enabled: true,
      },
      request: {
        audience: null,
        scopes: null,
        empty_audience: false,
        empty_scopes: false,
      },
    },
    {
      cache: {},
      request: {
        audience: null,
        scopes: null,
      },
    },
  ]

  // If token_exchange is equal to the default value, set token_exchange to null
  if (emptyTokenExchanges.some((emptyTokenExchange) => isEqual(config.token_exchange, emptyTokenExchange))) {
    config.token_exchange = null
    return config
  }

  const tokenExchangeIssuers = config.token_exchange.subject_token_issuers

  if (!tokenExchangeIssuers) {
    return config
  }

  // Clean up empty `conditions`
  tokenExchangeIssuers.forEach((issuer) => {
    // If conditions is an empty object, set conditions to null
    if (isEqual(issuer.conditions, {})) {
      issuer.conditions = null
    }

    // If every conditions field is an empty array, set conditions to null
    if (issuer.conditions && Object.values(issuer.conditions).every((value) => Array.isArray(value) && value.length === 0)) {
      issuer.conditions = null
    }
  })

  return config
}

export const resetEmptyProofOfPossessionMtlsFromHeader = (
  config?: { proof_of_possession_mtls_from_header?: ProofOfPossessionMtlsFromHeader | null },
) => {
  const mtlsConfig = config?.proof_of_possession_mtls_from_header

  if (!mtlsConfig) {
    return
  }

  // If ca_certificates is not an array or an empty array, set proof_of_possession_mtls_from_header to null
  if (!Array.isArray(mtlsConfig.ca_certificates) || mtlsConfig.ca_certificates.length === 0) {
    config.proof_of_possession_mtls_from_header = null
    return
  }

  // If mtlsConfig is equal to the default value, set proof_of_possession_mtls_from_header to null
  const emptyMtlsConfig: ProofOfPossessionMtlsFromHeader = {
    allow_partial_chain: false,
    cert_cache_ttl: 60000,
    certificate_header_format: 'url_encoded',
    http_timeout: 30000,
    revocation_check_mode: 'IGNORE_CA_ERROR',
    secure_source: true,
    ssl_verify: true,
  }

  if (isEqual(mtlsConfig, emptyMtlsConfig)) {
    config.proof_of_possession_mtls_from_header = null
  }
}

export const oidcSchema: OIDCSchema = {
  shamefullyTransformPayload(params) {

    resetEmptyTokenExchange(params.payload.config)
    resetEmptyProofOfPossessionMtlsFromHeader(params.payload.config)

    return params
  },
}
