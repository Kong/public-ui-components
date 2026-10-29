import { describe, it, expect } from 'vitest'
import { isSingularClaimDeprecated, migrateDeprecatedClaim } from './useDeprecatedClaimMigration'

describe('migrateDeprecatedClaim', () => {
  describe('migration triggers', () => {
    it('wraps string[] claim into string[][] when claims is null', () => {
      expect(migrateDeprecatedClaim({ claim: ['sub'], claims: null })).toEqual([['sub']])
    })

    it('wraps a plain string value into string[][]', () => {
      expect(migrateDeprecatedClaim({ claim: 'sub', claims: null })).toEqual([['sub']])
    })

    it('preserves multi-element string[] as inner array', () => {
      expect(migrateDeprecatedClaim({ claim: ['sub', 'email'], claims: null })).toEqual([['sub', 'email']])
    })

    it('triggers migration when claims is an empty array', () => {
      // Matches the original OIDCForm logic: !claims || claims.length === 0
      expect(migrateDeprecatedClaim({ claim: ['sub'], claims: [] })).toEqual([['sub']])
    })

    it('triggers migration when claims is undefined', () => {
      expect(migrateDeprecatedClaim({ claim: ['sub'], claims: undefined })).toEqual([['sub']])
    })
  })

  describe('migration does not trigger', () => {
    it('returns null when claims is already populated', () => {
      expect(migrateDeprecatedClaim({ claim: ['sub'], claims: [['username']] })).toBeNull()
    })

    it('returns null when claim is null', () => {
      expect(migrateDeprecatedClaim({ claim: null, claims: null })).toBeNull()
    })

    it('returns null when claim is undefined', () => {
      expect(migrateDeprecatedClaim({ claim: undefined, claims: null })).toBeNull()
    })

    it('returns null when claim is an empty string', () => {
      expect(migrateDeprecatedClaim({ claim: '', claims: null })).toBeNull()
    })

    it('returns null when claim is an empty array', () => {
      // The server shorthand keeps `credential_claim: []` / `consumer_claim: []`
      // unwrapped, and empty claim paths fail the plural fields' len_min = 1.
      expect(migrateDeprecatedClaim({ claim: [], claims: null })).toBeNull()
    })
  })

  describe('immutability', () => {
    it('does not mutate the input object', () => {
      const input: { claim: string[], claims: null } = { claim: ['sub'], claims: null }
      migrateDeprecatedClaim(input)
      expect(input.claims).toBeNull()
    })
  })
})

describe('isSingularClaimDeprecated', () => {
  const deprecatedShorthand = [{
    credential_claim: {
      type: 'array',
      elements: { type: 'string' },
      deprecation: {
        replaced_with: [{ path: ['credential_claims'] }],
        message: 'openid-connect: config.credential_claim is deprecated, please use config.credential_claims instead',
        removal_in_version: '4.0',
      },
    },
  }]

  it('is true when the shorthand entry is deprecated with replaced_with pointing at the plural', () => {
    expect(isSingularClaimDeprecated(deprecatedShorthand, 'credential_claim', 'credential_claims')).toBe(true)
  })

  it('is false when there is no shorthand entry (stale schema keeps the singular as a regular field)', () => {
    expect(isSingularClaimDeprecated(undefined, 'credential_claim', 'credential_claims')).toBe(false)
    expect(isSingularClaimDeprecated([], 'credential_claim', 'credential_claims')).toBe(false)
  })

  it('is false when the entry is not deprecated', () => {
    expect(isSingularClaimDeprecated([{ credential_claim: { type: 'array' } }], 'credential_claim', 'credential_claims')).toBe(false)
  })

  it('is false when replaced_with points at a different field', () => {
    expect(isSingularClaimDeprecated(deprecatedShorthand, 'credential_claim', 'some_other_field')).toBe(false)
  })

  it('is false for a different singular name', () => {
    expect(isSingularClaimDeprecated(deprecatedShorthand, 'consumer_claim', 'consumer_claims')).toBe(false)
  })
})
