import type { TokenExchange, ProofOfPossessionMtlsFromHeader } from './oidc'
import type { CommonSchemaFields } from './shared'

export interface KonnectApplicationAuthConfig_gte_314 {
  config?: {
    v2_strategies?: {
      openid_connect?: Array<{
        config?: {
          token_exchange?: TokenExchange | null
          proof_of_possession_mtls_from_header?: ProofOfPossessionMtlsFromHeader | null
        }
      }> | null
    } | null
  }
}

export interface KonnectApplicationAuthSchema extends CommonSchemaFields<KonnectApplicationAuthConfig_gte_314> {}
