import { it, expect } from 'vitest'
import { formatLogTimestamp } from './format'
import { runNonUtcTest, runUtcTest } from './specUtils'

runNonUtcTest('date formatting, non-UTC', () => {
  it('formatLogTimestamp should work', () => {
    const pattern = /^20\d{2}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}\.\d{3}(?:Z|[+-]\d{2}:?\d{2})?$/
    const date = new Date('2021-01-01T06:02:03.000Z')
    expect(formatLogTimestamp(date)).toMatch(pattern)
    expect(formatLogTimestamp(date.getTime())).toMatch(pattern)
  })

  it('formatLogTimestamp with TZ should work', () => {
    const date = new Date('2021-01-01T06:02:03.000Z')
    const formatted = formatLogTimestamp(date, { tz: 'America/New_York', includeTZ: true })
    expect(formatted).toBe('2021-01-01 01:02:03.000 (EST)')
  })
})

runUtcTest('date formatting in UTC', () => {
  it('formatLogTimestamp should work', () => {
    const str = '2020-01-01T01:02:03.000Z'
    const expectedNoTz = '2020-01-01 01:02:03.000'
    const expectedWithTz = '2020-01-01 01:02:03.000 (UTC)'
    const date = new Date(str)
    expect(formatLogTimestamp(date)).toBe(expectedNoTz)
    expect(formatLogTimestamp(date.getTime())).toBe(expectedNoTz)

    expect(formatLogTimestamp(date, { tz: 'UTC', includeTZ: true })).toBe(expectedWithTz)
  })
})
