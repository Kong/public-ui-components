import { isEqual } from 'lodash-es'
import type { AIMCPOauth2Schema, TokenExchange } from '../../types/plugins/ai-mcp-oauth2'


export const aiMCPOauth2Schema: AIMCPOauth2Schema = {
  shamefullyTransformPayload(params) {

    if (!params.payload.config || !params.payload.config?.token_exchange) {
      return params
    }

    const emptyTokenExchanges: TokenExchange[] = [
      {
        cache: {
          enabled: true,
          ttl: 3600,
        },
        client_auth: 'client_secret_basic',
        enabled: false,
        request: {
          actor_token_source: 'none',
          actor_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          audience: null,
          requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          scopes: null,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        },
      },
    ]

    if (emptyTokenExchanges.some((emptyTokenExchange) => isEqual(params.payload.config?.token_exchange, emptyTokenExchange))) {
      params.payload.config.token_exchange = null
    }

    return params
  },
}
