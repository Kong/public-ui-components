import type { OIDCSchema, TokenExchange } from '../../types/plugins/oidc'
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

export const oidcSchema: OIDCSchema = {
  shamefullyTransformPayload(params) {

    resetEmptyTokenExchange(params.payload.config)

    return params
  },
}
