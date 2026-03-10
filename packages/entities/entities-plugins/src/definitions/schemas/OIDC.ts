import type { OIDCSchema, TokenExchange } from '../../types/plugins/oidc'
import { isEqual } from 'lodash-es'

export const oidcSchema: OIDCSchema = {
  shamefullyTransformPayload(params) {

    // Non-3.14 version, skip transformation
    if (!params.payload.config?.token_exchange) {
      return params
    }

    const defaultTokenExchange = {
      cache: {
        enabled: true,
      },
      request: {
        empty_audience: false,
        empty_scopes: false,
      },
      subject_token_issuers: null,
    } satisfies TokenExchange

    // If token_exchange is equal to the default value, set token_exchange to null
    if (isEqual(params.payload.config.token_exchange, defaultTokenExchange)) {
      params.payload.config.token_exchange = null
      return params
    }

    const tokenExchangeIssuers = params.payload.config.token_exchange.subject_token_issuers

    if (!tokenExchangeIssuers) {
      return params
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

    return params
  },
}
