export type PrincipalsMode = 'kong-identity' | 'external'

export interface OidcPrincipals {
  directory?: string | null
  enabled?: boolean | null
  error_on_miss?: boolean | null
  match_consumer?: boolean | null
  match_consumer_groups?: boolean | null
  principal_by?: string | null
  /** string[] in the schema; legacy records may carry a plain string */
  principal_claim?: string[] | string | null
}

export interface OidcConfigSubset {
  issuer?: string | null
  client_id?: Array<string | null> | null
  client_secret?: Array<string | null> | null
  auth_methods?: string[] | null
  principals?: OidcPrincipals | null
}
