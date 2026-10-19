/**
 * Migrates a deprecated singular claim field (string[]) to its plural
 * replacement (string[][]): credential_claim → credential_claims,
 * consumer_claim → consumer_claims.
 * Returns the new plural value, or null if no migration is needed.
 */
export function migrateDeprecatedClaim(opts: {
  claim?: string | string[] | null
  claims?: string[][] | null
}): string[][] | null {
  const { claim, claims } = opts

  if (Array.isArray(claims) && claims.length > 0) {
    return null
  }

  if (claim === null || claim === undefined || claim === '') {
    return null
  }

  const claimArray = Array.isArray(claim) ? claim : [claim]
  return [claimArray]
}
