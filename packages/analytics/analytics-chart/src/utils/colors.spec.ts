import { lookupDatavisColor, statusCodeBadgeBackgroundColor } from './colors'
import { describe, it, expect } from 'vitest'

describe('lookupDatavisColor', () => {
  it('handles large numbers of entities', () => {
    expect(lookupDatavisColor(5)).toBe('#a86cd5')
  })
})

describe('statusCodeBadgeBackgroundColor', () => {
  it('uses legacy API Requests colors by status code group', () => {
    expect(statusCodeBadgeBackgroundColor('200')).toBe('#e5f7f4')
    expect(statusCodeBadgeBackgroundColor('503')).toBe('#fedada')
  })

  it('falls back for invalid status codes', () => {
    expect(statusCodeBadgeBackgroundColor('invalid')).toBe('#fafafa')
  })
})
