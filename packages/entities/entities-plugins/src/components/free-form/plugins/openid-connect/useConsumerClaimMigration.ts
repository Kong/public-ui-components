/**
 * Migrates deprecated consumer_claim (string[]) to consumer_claims (string[][]).
 * Returns the new consumer_claims value, or null if no migration is needed.
 */
export function migrateConsumerClaim(opts: {
  consumer_claim?: string | string[] | null
  consumer_claims?: string[][] | null
}): string[][] | null {
  const { consumer_claim, consumer_claims } = opts

  if (Array.isArray(consumer_claims) && consumer_claims.length > 0) {
    return null
  }

  if (consumer_claim === null || consumer_claim === undefined || consumer_claim === '') {
    return null
  }

  const claimArray = Array.isArray(consumer_claim) ? consumer_claim : [consumer_claim]
  return [claimArray]
}
