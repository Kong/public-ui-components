import type { OIDCSchema } from '../../types/plugins/oidc'
import { isEqual } from 'lodash-es'

export const oidcSchema: OIDCSchema = {
  shamefullyTransformPayload(params) {

    // Non-3.14 version, skip transformation
    if (!params.payload.config?.token_exchange) {
      return params
    }

    const tokenExchangeIssuers = params.payload.config.token_exchange.subject_token_issuers

    if (!tokenExchangeIssuers) {
      return params
    }

    // Clean up empty `conditions`
    tokenExchangeIssuers.forEach((issuer) => {
      // If conditions is an empty object, remove it
      if (isEqual(issuer.conditions, {})) {
        delete issuer.conditions
      }

      // If every conditions field is an empty array, remove conditions
      if (issuer.conditions && Object.values(issuer.conditions).every((value) => Array.isArray(value) && value.length === 0)) {
        delete issuer.conditions
      }
    })

    return params
  },
}
