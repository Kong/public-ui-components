import { describe, it, expect } from 'vitest'

import { getCountryName } from './GeoLookup'
import { COUNTRIES, type CountryISOA2 } from '../types/country-codes'

describe('getCountryName (unit)', () => {
  it.each([
    ['US', 'United States'],
    ['GB', 'United Kingdom'],
    ['DE', 'Germany'],
    ['JP', 'Japan'],
  ])('returns full name for code %s', (code, expected) => {
    expect(getCountryName(code as CountryISOA2)).toBe(expected)
  })

  it('falls back to the code when not found', () => {
    expect(getCountryName('ZZ' as CountryISOA2)).toBe('ZZ')
  })

  it('COUNTRIES table codes map to their names', () => {
    for (const { code, name } of COUNTRIES) {
      expect(getCountryName(code as CountryISOA2)).toBe(name)
    }
  })

  it('is case-sensitive lowercase passes through as given', () => {
    expect(getCountryName('us' as CountryISOA2)).toBe('us')
  })
})
