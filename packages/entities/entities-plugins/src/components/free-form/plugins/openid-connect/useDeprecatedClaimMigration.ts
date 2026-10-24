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

  // An empty array means "no claims" and must stay empty: the server shorthand keeps
  // `credential_claim: []` / `consumer_claim: []` unwrapped, and the plural fields
  // reject empty claim paths (elements.len_min = 1).
  if (Array.isArray(claim) && claim.length === 0) {
    return null
  }

  const claimArray = Array.isArray(claim) ? claim : [claim]
  return [claimArray]
}
