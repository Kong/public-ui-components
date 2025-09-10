import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect } from 'vitest'
import { formatChartTicksByGranularity, formatTooltipTimestampByGranularity } from './format-timestamps'

describe('formatChartTicksByGranularity', () => {
  const testDate = new Date('2024-12-10T15:30:45Z')

  it.each([
    ['secondly'],
    ['tenSecondly'],
    ['thirtySecondly'],
  ])('displays seconds when formatting \'%s\' granularity in UTC', (granularity) => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('3:30:45 PM')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: true,
      timezone: 'UTC',
    })).toBe('2024-12-10 3:30:45 PM')
  })

  it.each([
    ['secondly'],
    ['tenSecondly'],
    ['thirtySecondly'],
  ])('displays seconds when formatting \'%s\' granularity in America/New_York', (granularity) => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('10:30:45 AM')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: true,
      timezone: 'America/New_York',
    })).toBe('2024-12-10 10:30:45 AM')
  })

  it.each([
    ['minutely'],
    ['fiveMinutely'],
    ['tenMinutely'],
    ['thirtyMinutely'],
    ['hourly'],
    ['twoHourly'],
  ])('displays minutes when formatting \'%s\' granularity in UTC', (granularity) => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('3:30 PM')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: true,
      timezone: 'UTC',
    })).toBe('2024-12-10 3:30 PM')
  })

  it.each([
    ['minutely'],
    ['fiveMinutely'],
    ['tenMinutely'],
    ['thirtyMinutely'],
    ['hourly'],
    ['twoHourly'],
  ])('displays minutes when formatting \'%s\' granularity in America/New_York', (granularity) => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('10:30 AM')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: granularity as GranularityValues,
      dayBoundaryCrossed: true,
      timezone: 'America/New_York',
    })).toBe('2024-12-10 10:30 AM')
  })

  it('formats correctly for twelveHourly granularity in UTC and America/New_York', () => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'twelveHourly',
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('2024-12-10 3:30 PM')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'twelveHourly',
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('2024-12-10 10:30 AM')
  })

  it('formats correctly for daily granularity in UTC and America/New_York', () => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'daily',
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('2024-12-10')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'daily',
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('2024-12-10')
  })

  it('formats correctly for weekly granularity in UTC and America/New_York', () => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'weekly',
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('2024 W50')
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      granularity: 'weekly',
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('2024 W50')
  })

  it('formats with default format for unknown granularities in UTC and America/New_York', () => {
    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      // @ts-ignore - testing unknown granularity
      granularity: 'unknownGranularity',
      dayBoundaryCrossed: false,
      timezone: 'UTC',
    })).toBe('2024-12-10 3:30:45 PM')

    expect(formatChartTicksByGranularity({
      tickValue: testDate,
      // @ts-ignore - testing unknown granularity
      granularity: 'unknownGranularity',
      dayBoundaryCrossed: false,
      timezone: 'America/New_York',
    })).toBe('2024-12-10 10:30:45 AM')
  })

  describe('formatTooltipTimestampByGranularity', () => {
    const testDate = new Date('2024-12-10T15:30:45Z')

    it.each([
      ['secondly', 'Dec 10, 2024 3:30:45 PM'],
      ['tenSecondly', 'Dec 10, 2024 3:30:45 PM'],
      ['thirtySecondly', 'Dec 10, 2024 3:30:45 PM'],
      ['minutely', 'Dec 10, 2024 3:30 PM'],
      ['fiveMinutely', 'Dec 10, 2024 3:30 PM'],
      ['tenMinutely', 'Dec 10, 2024 3:30 PM'],
      ['thirtyMinutely', 'Dec 10, 2024 3:30 PM'],
      ['hourly', 'Dec 10, 2024 3:30 PM'],
      ['twoHourly', 'Dec 10, 2024 3:30 PM'],
      ['twelveHourly', 'Dec 10, 2024 3:30 PM'],
      ['daily', 'Dec 10, 2024'],
      ['weekly', '2024 W50'],
    ])('formats \'%s\' granularity in UTC', (granularity, expected) => {
      expect(formatTooltipTimestampByGranularity({
        tickValue: testDate,
        granularity: granularity as GranularityValues,
        timezone: 'UTC',
      })).toBe(expected)
    })

    it.each([
      ['secondly', 'Dec 10, 2024 10:30:45 AM'],
      ['tenSecondly', 'Dec 10, 2024 10:30:45 AM'],
      ['thirtySecondly', 'Dec 10, 2024 10:30:45 AM'],
      ['minutely', 'Dec 10, 2024 10:30 AM'],
      ['fiveMinutely', 'Dec 10, 2024 10:30 AM'],
      ['tenMinutely', 'Dec 10, 2024 10:30 AM'],
      ['thirtyMinutely', 'Dec 10, 2024 10:30 AM'],
      ['hourly', 'Dec 10, 2024 10:30 AM'],
      ['twoHourly', 'Dec 10, 2024 10:30 AM'],
      ['twelveHourly', 'Dec 10, 2024 10:30 AM'],
      ['daily', 'Dec 10, 2024'],
      ['weekly', '2024 W50'],
    ])('formats \'%s\' granularity in America/New_York', (granularity, expected) => {
      expect(formatTooltipTimestampByGranularity({
        tickValue: testDate,
        granularity: granularity as GranularityValues,
        timezone: 'America/New_York',
      })).toBe(expected)
    })
  })
})
