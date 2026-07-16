import { describe, it, expect, vi } from 'vitest'
import { formatTime } from './format'

describe('formatTime', () => {
  it('can function without a timezone', () => {
    expect(formatTime(1654781874614)).toContain('Jun')
  })

  it('formats valid timestamps', () => {
    expect(formatTime(1654781874614, { tz: 'UTC', includeTZ: true })).toBe('Jun 09, 2022 01:37 PM (UTC)')
  })

  it('formats valid timestamps no timezone', () => {
    expect(formatTime(1654781774714, { tz: 'UTC', includeTZ: false })).toBe('Jun 09, 2022 01:36 PM')
  })

  it('passes through falsey values', () => {
    expect(formatTime(null)).toBe(null)
  })

  it('rejects invalid values', () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(formatTime('blah')).toBe('(invalid date)')
    expect(errorMock).toHaveBeenCalledOnce()
    errorMock.mockRestore()
  })

  it('can format short timestamp', () => {
    expect(formatTime(1654781774714, { short: true })).toBe('Jun 09, 2022')
  })

  it('can format short timestamp with tz', () => {
    expect(formatTime(1654781774714, { short: true, tz: 'UTC', includeTZ: true })).toBe('Jun 09, 2022 (UTC)')
  })
})
