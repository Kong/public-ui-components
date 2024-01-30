import { lookupStatusCodeCategoryColor, lookupStatusCodeColor, lightGrey } from './customColors'
import { describe, it, expect } from 'vitest'

describe('lookupStatusCodeColor', () => {
  it('correctly resolves specific colors', () => {
    expect(lookupStatusCodeColor('100')).toBe('#80bfff')
    expect(lookupStatusCodeColor('200')).toBe('#9edca6')

    // Check that the loop-around works correctly.
    expect(lookupStatusCodeColor('408')).toBe('#cc6100')
    expect(lookupStatusCodeColor('409')).toBe('#ffd5b1')
  })

  it('correctly handles out-of-spec codes', () => {
    expect(lookupStatusCodeColor('210')).toBe('#ceedd2')
    expect(lookupStatusCodeColor('512')).toBe('#ffd5d5')
  })

  it('gracefully handles invalid codes', () => {
    expect(lookupStatusCodeColor('600')).toBe(lightGrey)
    expect(lookupStatusCodeColor('000')).toBe(lightGrey)
  })
})

describe('lookupStatusCodeCategoryColor', () => {
  it('creates the correct shape', () => {
    expect(lookupStatusCodeCategoryColor('200')).toEqual({ solid: '#9edca6', light: '#9edca6' })
  })
})
