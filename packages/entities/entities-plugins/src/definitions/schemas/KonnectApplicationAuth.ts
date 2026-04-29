import type { KonnectApplicationAuthSchema } from '../../types/plugins/konnect-application-auth'
import { resetEmptyTokenExchange, resetEmptyProofOfPossessionMtlsFromHeader } from './OIDC'


export const konnectApplicationAuthSchema: KonnectApplicationAuthSchema = {
  shamefullyTransformPayload(params) {

    const oidcStrategies = params.payload.config?.v2_strategies?.openid_connect

    if (Array.isArray(oidcStrategies)) {
      oidcStrategies.forEach((strategy) => {
        resetEmptyTokenExchange(strategy.config)
        resetEmptyProofOfPossessionMtlsFromHeader(strategy.config)
      })
    }

    return params
  },
}
