import { describe, it, expect } from 'vitest'
import { formatByGranularity } from './format-timestamps'

describe('formatByGranularity', () => {
  const testDate = new Date('2024-12-10T15:30:45Z')

  it('formats correctly for second-based granularities', () => {
    expect(formatByGranularity(testDate, 'secondly', false)).toBe('7:30:45 AM')
    expect(formatByGranularity(testDate, 'secondly', true)).toBe('2024-12-10 7:30:45 AM')
  })

  it('formats correctly for minute-based granularities', () => {
    expect(formatByGranularity(testDate, 'minutely', false)).toBe('7:30 AM')
    expect(formatByGranularity(testDate, 'hourly', true)).toBe('2024-12-10 7:30 AM')
  })

  it('formats correctly for twelveHourly granularity', () => {
    expect(formatByGranularity(testDate, 'twelveHourly', false)).toBe('2024-12-10 7:30 AM')
  })

  it('formats correctly for daily granularity', () => {
    expect(formatByGranularity(testDate, 'daily', false)).toBe('2024-12-10')
  })

  it('formats correctly for weekly granularity', () => {
    expect(formatByGranularity(testDate, 'weekly', false)).toBe('2024  W50')
  })

  it('formats with default format for unknown granularities', () => {
    // @ts-ignore - testing unknown granularity
    expect(formatByGranularity(testDate, 'unknownGranularity', false)).toBe('2024-12-10 7:30:45 AM')
  })
})
