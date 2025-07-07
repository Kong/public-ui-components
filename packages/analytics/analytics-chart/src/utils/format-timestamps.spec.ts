import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect } from 'vitest'
import { formatByGranularity } from './format-timestamps'

describe('formatByGranularity', () => {
  const testDate = new Date('2024-12-10T15:30:45Z')

  it.each([
    ['secondly'],
    ['tenSecondly'],
    ['thirtySecondly'],
  ])('displays seconds when formatting \'%s\' granularity in UTC', (granularity) => {
    expect(formatByGranularity(testDate, granularity as GranularityValues, false, 'UTC')).toBe('3:30:45 PM')
    expect(formatByGranularity(testDate, granularity as GranularityValues, true, 'UTC')).toBe('2024-12-10 3:30:45 PM')
  })

  it.each([
    ['secondly'],
    ['tenSecondly'],
    ['thirtySecondly'],
  ])('displays seconds when formatting \'%s\' granularity in America/New_York', (granularity) => {
    expect(formatByGranularity(testDate, granularity as GranularityValues, false, 'America/New_York')).toBe('10:30:45 AM')
    expect(formatByGranularity(testDate, granularity as GranularityValues, true, 'America/New_York')).toBe('2024-12-10 10:30:45 AM')
  })

  it.each([
    ['minutely'],
    ['fiveMinutely'],
    ['tenMinutely'],
    ['thirtyMinutely'],
    ['hourly'],
    ['twoHourly'],
  ])('displays minutes when formatting \'%s\' granularity in UTC', (granularity) => {
    expect(formatByGranularity(testDate, granularity as GranularityValues, false, 'UTC')).toBe('3:30 PM')
    expect(formatByGranularity(testDate, granularity as GranularityValues, true, 'UTC')).toBe('2024-12-10 3:30 PM')
  })

  it.each([
    ['minutely'],
    ['fiveMinutely'],
    ['tenMinutely'],
    ['thirtyMinutely'],
    ['hourly'],
    ['twoHourly'],
  ])('displays minutes when formatting \'%s\' granularity in America/New_York', (granularity) => {
    expect(formatByGranularity(testDate, granularity as GranularityValues, false, 'America/New_York')).toBe('10:30 AM')
    expect(formatByGranularity(testDate, granularity as GranularityValues, true, 'America/New_York')).toBe('2024-12-10 10:30 AM')
  })

  it('formats correctly for twelveHourly granularity in UTC and America/New_York', () => {
    expect(formatByGranularity(testDate, 'twelveHourly', false, 'UTC')).toBe('2024-12-10 3:30 PM')
    expect(formatByGranularity(testDate, 'twelveHourly', false, 'America/New_York')).toBe('2024-12-10 10:30 AM')
  })

  it('formats correctly for daily granularity in UTC and America/New_York', () => {
    expect(formatByGranularity(testDate, 'daily', false, 'UTC')).toBe('2024-12-10')
    expect(formatByGranularity(testDate, 'daily', false, 'America/New_York')).toBe('2024-12-10')
  })

  it('formats correctly for weekly granularity in UTC and America/New_York', () => {
    expect(formatByGranularity(testDate, 'weekly', false, 'UTC')).toBe('2024 W50')
    expect(formatByGranularity(testDate, 'weekly', false, 'America/New_York')).toBe('2024 W50')
  })

  it('formats with default format for unknown granularities in UTC and America/New_York', () => {
    // @ts-ignore - testing unknown granularity
    expect(formatByGranularity(testDate, 'unknownGranularity', false, 'UTC')).toBe('2024-12-10 3:30:45 PM')

    // @ts-ignore - testing unknown granularity
    expect(formatByGranularity(testDate, 'unknownGranularity', false, 'America/New_York')).toBe('2024-12-10 10:30:45 AM')
  })
})
