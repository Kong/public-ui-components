import { describe, it, expect } from 'vitest'
import { migrateConsumerClaim } from './useConsumerClaimMigration'

describe('migrateConsumerClaim', () => {
  describe('migration triggers', () => {
    it('wraps string[] consumer_claim into string[][] when consumer_claims is null', () => {
      expect(migrateConsumerClaim({ consumer_claim: ['sub'], consumer_claims: null })).toEqual([['sub']])
    })

    it('wraps a plain string value into string[][]', () => {
      expect(migrateConsumerClaim({ consumer_claim: 'sub', consumer_claims: null })).toEqual([['sub']])
    })

    it('preserves multi-element string[] as inner array', () => {
      expect(migrateConsumerClaim({ consumer_claim: ['sub', 'email'], consumer_claims: null })).toEqual([['sub', 'email']])
    })

    it('triggers migration when consumer_claims is an empty array', () => {
      // Matches the original OIDCForm logic: !consumer_claims || consumer_claims.length === 0
      expect(migrateConsumerClaim({ consumer_claim: ['sub'], consumer_claims: [] })).toEqual([['sub']])
    })

    it('triggers migration when consumer_claims is undefined', () => {
      expect(migrateConsumerClaim({ consumer_claim: ['sub'], consumer_claims: undefined })).toEqual([['sub']])
    })
  })

  describe('migration does not trigger', () => {
    it('returns null when consumer_claims is already populated', () => {
      expect(migrateConsumerClaim({ consumer_claim: ['sub'], consumer_claims: [['username']] })).toBeNull()
    })

    it('returns null when consumer_claim is null', () => {
      expect(migrateConsumerClaim({ consumer_claim: null, consumer_claims: null })).toBeNull()
    })

    it('returns null when consumer_claim is undefined', () => {
      expect(migrateConsumerClaim({ consumer_claim: undefined, consumer_claims: null })).toBeNull()
    })

    it('returns null when consumer_claim is an empty string', () => {
      expect(migrateConsumerClaim({ consumer_claim: '', consumer_claims: null })).toBeNull()
    })
  })

  describe('immutability', () => {
    it('does not mutate the input object', () => {
      const input: { consumer_claim: string[], consumer_claims: null } = { consumer_claim: ['sub'], consumer_claims: null }
      migrateConsumerClaim(input)
      expect(input.consumer_claims).toBeNull()
    })
  })
})
