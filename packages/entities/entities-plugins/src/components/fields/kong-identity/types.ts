export interface KongIdentityPrincipals {
  enabled: boolean
  directory: string
}

export type AuthMode = 'kong-identity' | 'consumers' | 'centrally-managed'
