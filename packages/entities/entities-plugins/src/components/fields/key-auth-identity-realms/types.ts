export type IdentityRealmItem =
  | { scope: 'cp', id: null, region: null }
  | { scope: 'realm', id: string, region?: string }
