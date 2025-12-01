import { it, expect, describe } from 'vitest'
import { formatTimestamp, type TimeFormatOptions } from './format'
import { runNonUtcTest, runUtcTest } from './specUtils'

const formatCases: Array<{
  format: TimeFormatOptions['format']
  pattern: RegExp
  utcExpected: string
}> = [
  { format: 'short', pattern: /^\w{3} \d{2}, \d{4}$/, utcExpected: 'Jan 01, 2020' },
  { format: 'default', pattern: /^\w{3} \d{2}, \d{4} \d{2}:\d{2} [AP]M$/, utcExpected: 'Jan 01, 2020 01:02 AM' },
  { format: 'full', pattern: /^\w{3} \d{2}, \d{4} \d{2}:\d{2}:\d{2}\.\d{3} [AP]M$/, utcExpected: 'Jan 01, 2020 01:02:03.000 AM' },
]

runNonUtcTest('formatTimestamp, non-UTC', () => {
  describe.each(formatCases)('format: $format', ({ format, pattern }) => {
    it('should format Date correctly', () => {
      const date = new Date('2021-01-01T06:02:03.000Z')
      expect(formatTimestamp(date, { format })).toMatch(pattern)
    })

    it('should format timestamp number correctly', () => {
      const date = new Date('2021-01-01T06:02:03.000Z')
      expect(formatTimestamp(date.getTime(), { format })).toMatch(pattern)
    })

    it('should include timezone when includeTZ is true', () => {
      const date = new Date('2021-01-01T06:02:03.000Z')
      const formatted = formatTimestamp(date, { format, tz: 'America/New_York', includeTZ: true })
      expect(formatted).toMatch(/\([A-Z]{2,4}\)$/)
    })
  })
})

runUtcTest('formatTimestamp in UTC', () => {
  describe.each(formatCases)('format: $format', ({ format, pattern, utcExpected }) => {
    const testDate = new Date('2020-01-01T01:02:03.000Z')

    it('should format Date correctly', () => {
      expect(formatTimestamp(testDate, { format, tz: 'UTC' })).toBe(utcExpected)
    })

    it('should format timestamp number correctly', () => {
      expect(formatTimestamp(testDate.getTime(), { format, tz: 'UTC' })).toBe(utcExpected)
    })

    it('should match expected pattern', () => {
      expect(formatTimestamp(testDate, { format, tz: 'UTC' })).toMatch(pattern)
    })

    it('should include timezone when includeTZ is true', () => {
      const formatted = formatTimestamp(testDate, { format, tz: 'UTC', includeTZ: true })
      expect(formatted).toBe(`${utcExpected} (UTC)`)
    })
  })
})
