import { describe, it, expect } from 'vitest'
import { formatByGranularity } from './format-timestamps'

describe('formatByGranularity', () => {
  const testDate = new Date('2024-12-10T15:30:45Z')

  it('formats correctly for second-based granularities in UTC', () => {
    expect(formatByGranularity(testDate, 'secondly', false, 'UTC')).toBe('3:30:45 PM')
    expect(formatByGranularity(testDate, 'secondly', true, 'UTC')).toBe('2024-12-10 3:30:45 PM')
  })

  it('formats correctly for minute-based granularities in UTC', () => {
    expect(formatByGranularity(testDate, 'minutely', false, 'UTC')).toBe('3:30 PM')
    expect(formatByGranularity(testDate, 'hourly', true, 'UTC')).toBe('2024-12-10 3:30 PM')
  })

  it('formats correctly for twelveHourly granularity in UTC', () => {
    expect(formatByGranularity(testDate, 'twelveHourly', false, 'UTC')).toBe('2024-12-10 3:30 PM')
  })

  it('formats correctly for daily granularity in UTC', () => {
    expect(formatByGranularity(testDate, 'daily', false, 'UTC')).toBe('2024-12-10')
  })

  it('formats correctly for weekly granularity in UTC', () => {
    expect(formatByGranularity(testDate, 'weekly', false, 'UTC')).toBe('2024  W50')
  })

  it('formats with default format for unknown granularities in UTC', () => {
    // @ts-ignore - testing unknown granularity
    expect(formatByGranularity(testDate, 'unknownGranularity', false, 'UTC')).toBe('2024-12-10 3:30:45 PM')
  })

  it('formats correctly for second-based granularities in America/New_York', () => {
    expect(formatByGranularity(testDate, 'secondly', false, 'America/New_York')).toBe('10:30:45 AM')
    expect(formatByGranularity(testDate, 'secondly', true, 'America/New_York')).toBe('2024-12-10 10:30:45 AM')
  })

  it('formats correctly for minute-based granularities in America/New_York', () => {
    expect(formatByGranularity(testDate, 'minutely', false, 'America/New_York')).toBe('10:30 AM')
    expect(formatByGranularity(testDate, 'hourly', true, 'America/New_York')).toBe('2024-12-10 10:30 AM')
  })
})
