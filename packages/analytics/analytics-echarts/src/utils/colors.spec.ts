import { lookupDatavisColor } from './colors'
import { describe, it, expect } from 'vitest'

describe('lookupDatavisColor', () => {
  it('handles large numbers of entities', () => {
    expect(lookupDatavisColor(5)).toBe('#a86cd5')
  })
})
