import { it, expect } from 'vitest'
import { formatISOTimeWithTZ, formatTime } from './format'
import { runNonUtcTest, runUtcTest } from './specUtils'

runNonUtcTest('date formatting, non-UTC', () => {
  it('formatISOTimeWithTZ should work', () => {
    const pattern = /20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\d[+-]\d\d?:\d\d/
    const date = new Date('2021-01-01T06:02:03.000Z')
    expect(formatISOTimeWithTZ(date)).toMatch(pattern)
    expect(formatISOTimeWithTZ(date.getTime())).toMatch(pattern)
  })
})

runUtcTest('date formatting in UTC', () => {
  it('formatISOTimeWithTZ should work', () => {
    const str = '2020-01-01T01:02:03.000Z'
    const date = new Date(str)
    expect(formatISOTimeWithTZ(date)).toBe(str)
    expect(formatISOTimeWithTZ(date.getTime())).toBe(str)
  })
})

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
    expect(formatTime('blah')).toBe('(invalid date)')
  })

  it('can format short timestamp', () => {
    expect(formatTime(1654781774714, { short: true })).toBe('Jun 09, 2022')
  })

  it('can format short timestamp with tz', () => {
    expect(formatTime(1654781774714, { short: true, tz: 'UTC', includeTZ: true })).toBe('Jun 09, 2022 (UTC)')
  })
})
