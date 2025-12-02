import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { add, setDate, startOfDay, startOfMonth, startOfWeek, subMilliseconds } from 'date-fns'

import { TimeframeKeys } from './types'
import { DeltaQueryTime, TimeseriesQueryTime, UnaryQueryTime } from './queryTime'
import { datePickerSelectionToTimeframe, Timeframe, TimePeriods } from './timeframes'
import { formatInTimeZone } from 'date-fns-tz'
import { runUtcTest } from './specUtils'

const standardizeTimezone = (d: Date) => {
  // Adjust according to the test runner's timezone for consistent results.
  // Due to DST, we need to use the offset of the fake date rather than the current date.
  const currentMinutes = d.getMinutes()

  d.setMinutes(-d.getTimezoneOffset())

  // Set the minutes back to what they were; the DST adjustment clobbers this field.
  d.setMinutes(currentMinutes)
}

// Wrapper for TimePeriods.get() that avoids returning `undefined`
const getTimePeriod = (timeperiod: string): Timeframe => {
  const validTimeperiod = TimePeriods.get(timeperiod)

  if (validTimeperiod) {
    return validTimeperiod
  }

  throw new Error('Invalid Timeframe requested')
}

describe('granularity enforcement', () => {
  it('enforces allowed granularity for timeseries queries', () => {
    const tsQuery = new TimeseriesQueryTime(
      getTimePeriod(TimeframeKeys.THIRTY_DAY),
      'minutely',
    )

    expect(tsQuery.granularitySeconds()).toBe(24 * 60 * 60)
  })

  it('handles fine granularity in default responses', () => {
    // Should permit allowed finer grains if requested.
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY), 'tenMinutely', undefined, undefined, true).granularitySeconds()).toBe(10 * 60)

    // Should not permit finer grains outside the allowed finer grains.
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY), 'tenSecondly', undefined, undefined, true).granularitySeconds()).toBe(30 * 60)

    // Should pick an appropriate default response granularity.
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY), undefined, undefined, undefined, true).granularitySeconds()).toBe(30 * 60)
  })

})

describe('timeframe start/end times', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const fakeNow = new Date('2023-01-31T12:31:29Z')

    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const endMinutely = new Date('2023-01-31T12:32:00Z')
  const endHourly = new Date('2023-01-31T13:00:00Z')

  standardizeTimezone(endMinutely)
  standardizeTimezone(endHourly)

  // For daily, we want to adjust to the start of the day.
  const endDaily = startOfDay(new Date('2023-02-01T12:00:00Z'))

  it('rounds end correctly', () => {
    // Minutely periods: `endDate` should be "now" ceil'd to the next minute.
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.FIFTEEN_MIN)).endDate()).toEqual(endMinutely)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_HOUR)).endDate()).toEqual(endMinutely)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SIX_HOUR)).endDate()).toEqual(endHourly)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.TWELVE_HOUR)).endDate()).toEqual(endHourly)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY)).endDate()).toEqual(endHourly)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).endDate()).toEqual(endDaily)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).endDate()).toEqual(endDaily)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).endDate()).toEqual(endDaily)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).endDate()).toEqual(endDaily)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).endDate()).toEqual(startOfWeek(endDaily, { weekStartsOn: 1 }))
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).endDate()).toEqual(startOfMonth(new Date()))
  })

  it('spot-check start times', () => {
    const doCheck = (dateString: string, timeframeKey: TimeframeKeys, daily = false) => {
      let startDate = new Date(dateString)

      if (daily) {
        // Adjust upward for daily.
        startDate = startOfDay(startDate)
      } else {
        standardizeTimezone(startDate)
      }

      expect(new TimeseriesQueryTime(getTimePeriod(timeframeKey)).startDate()).toEqual(startDate)
    }

    doCheck('2023-01-31T12:17:00Z', TimeframeKeys.FIFTEEN_MIN)
    doCheck('2023-01-31T01:00:00Z', TimeframeKeys.TWELVE_HOUR)
    doCheck('2023-01-25T12:00:00Z', TimeframeKeys.SEVEN_DAY, true)
    doCheck('2023-01-02T12:00:00Z', TimeframeKeys.THIRTY_DAY, true)
  })

  it('start = end - timeframe length', () => {
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.FIFTEEN_MIN)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.FIFTEEN_MIN)).endDate(),
        getTimePeriod(TimeframeKeys.FIFTEEN_MIN).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_HOUR)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_HOUR)).endDate(),
        getTimePeriod(TimeframeKeys.ONE_HOUR).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SIX_HOUR)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SIX_HOUR)).endDate(),
        getTimePeriod(TimeframeKeys.SIX_HOUR).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.TWELVE_HOUR)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.TWELVE_HOUR)).endDate(),
        getTimePeriod(TimeframeKeys.TWELVE_HOUR).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY)).endDate(),
        getTimePeriod(TimeframeKeys.ONE_DAY).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).endDate(),
        getTimePeriod(TimeframeKeys.SEVEN_DAY).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).endDate(),
        getTimePeriod(TimeframeKeys.THIRTY_DAY).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).endDate(),
        getTimePeriod(TimeframeKeys.CURRENT_WEEK).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).endDate(),
        getTimePeriod(TimeframeKeys.CURRENT_MONTH).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).endDate(),
        getTimePeriod(TimeframeKeys.PREVIOUS_WEEK).timeframeLengthMs()))

    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).startDate()).toEqual(
      subMilliseconds(
        new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).endDate(),
        getTimePeriod(TimeframeKeys.PREVIOUS_MONTH).timeframeLengthMs()))
  })

  it('minutely timeframes start rounded', () => {
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.FIFTEEN_MIN)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_HOUR)).startDate().getSeconds()).toEqual(0)
  })

  it('hourly timeframes start rounded', () => {
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SIX_HOUR)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SIX_HOUR)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.TWELVE_HOUR)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.TWELVE_HOUR)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY)).startDate().getMinutes()).toEqual(0)
  })

  it('daily timeframes start rounded', () => {
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY)).startDate().getHours()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY)).startDate().getHours()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK)).startDate().getHours()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH)).startDate().getHours()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK)).startDate().getHours()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).startDate().getSeconds()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).startDate().getMinutes()).toEqual(0)
    expect(new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH)).startDate().getHours()).toEqual(0)
  })

  it('custom timeframe daily', () => {
    const end = setDate(new Date(), 20)
    const start = setDate(end, 10)

    const timeframe = datePickerSelectionToTimeframe({
      end,
      start,
      timePeriodsKey: 'custom',
    })

    const queryTime = new TimeseriesQueryTime(timeframe)

    expect(timeframe.dataGranularity).toEqual('daily')
    expect(queryTime.endDate().getHours()).toEqual(0)
    expect(queryTime.endDate().getMinutes()).toEqual(0)
    expect(queryTime.endDate().getSeconds()).toEqual(0)
    expect(queryTime.startDate().getHours()).toEqual(0)
    expect(queryTime.startDate().getMinutes()).toEqual(0)
    expect(queryTime.startDate().getSeconds()).toEqual(0)

    expect(queryTime.endDate().getDay()).toEqual(end.getDay() + 1) // ceil of end by daily granularity
    expect(queryTime.startDate().getDay()).toEqual(start.getDay()) // floor of start by daily granularity
  })
})

describe('pseudo-absolute periods', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const fakeNow = new Date('2023-01-31T12:00:00Z')

    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates the correct start and end time for current month', () => {
    const timeQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH))

    const expectedStart = startOfDay(new Date('2023-01-01T12:00:00Z'))
    const expectedEnd = startOfDay(new Date('2023-02-01T12:00:00Z'))

    expect(timeQuery.startDate()).toEqual(expectedStart)
    expect(timeQuery.endDate()).toEqual(expectedEnd)
  })

  it('calculates the correct start and end time for current week', () => {
    const timeQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK))

    const expectedStart = startOfDay(new Date('2023-01-30T12:00:00Z'))
    const expectedEnd = startOfDay(new Date('2023-02-01T12:00:00Z'))

    expect(timeQuery.startDate()).toEqual(expectedStart)
    expect(timeQuery.endDate()).toEqual(expectedEnd)
  })

  it('calculates the correct start and end time for previous month', () => {
    const timeQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH))

    const expectedStart = startOfDay(new Date('2022-12-01T12:00:00Z'))
    const expectedEnd = startOfDay(new Date('2023-01-01T12:00:00Z'))

    expect(timeQuery.startDate()).toEqual(expectedStart)
    expect(timeQuery.endDate()).toEqual(expectedEnd)
  })

  it('calculates the correct start and end time for previous week', () => {
    const timeQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK))

    const expectedStart = startOfDay(new Date('2023-01-23T12:00:00Z'))
    const expectedEnd = startOfDay(new Date('2023-01-30T12:00:00Z'))

    expect(timeQuery.startDate()).toEqual(expectedStart)
    expect(timeQuery.endDate()).toEqual(expectedEnd)
  })
})

describe('edge cases around pseudo-absolute periods', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const fakeNow = new Date('2023-03-31T12:00:00Z')

    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles February in previous month calculations', () => {
    const timeQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH))

    const expectedStart = startOfDay(new Date('2023-02-01T12:00:00Z'))
    const expectedEnd = startOfDay(new Date('2023-03-01T12:00:00Z'))

    expect(timeQuery.startDate()).toEqual(expectedStart)
    expect(timeQuery.endDate()).toEqual(expectedEnd)
  })
})

describe('queries with mocked dates', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const fakeNow = new Date('2022-07-08T12:00:00Z')

    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates start, end, and granularity for hourly timeseries queries', () => {
    const tsQuery = new TimeseriesQueryTime(
      getTimePeriod(TimeframeKeys.SEVEN_DAY),
      'hourly',
    )

    const expectedStart = new Date('2022-07-01T12:00:00Z')

    expectedStart.setMinutes(-expectedStart.getTimezoneOffset())

    expect(tsQuery.startDate()).toEqual(expectedStart)

    const expectedEnd = new Date('2022-07-08T12:00:00Z')

    expectedEnd.setMinutes(-expectedEnd.getTimezoneOffset())

    expect(tsQuery.endDate()).toEqual(expectedEnd)

    expect(tsQuery.granularitySeconds()).toBe(60 * 60)
  })

  it('calculates start, end, and granularity for daily timeseries queries', () => {
    const tsQuery = new TimeseriesQueryTime(
      getTimePeriod(TimeframeKeys.SEVEN_DAY),
      'daily',
    )

    // Note this is later than the hourly query start date; relative daily queries round start and end up.
    expect(tsQuery.startDate()).toEqual(startOfDay(new Date('2022-07-02T12:00:00Z')))

    expect(tsQuery.endDate()).toEqual(startOfDay(new Date('2022-07-09T12:00:00Z')))

    expect(tsQuery.granularitySeconds()).toBe(24 * 60 * 60)
  })

  it('calculates start, end, and granularity for unary queries', () => {
    const bigNumberQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY))

    // Data granularity is simulated to be daily, so we expect to round to the start of the day.
    expect(bigNumberQuery.startDate()).toEqual(startOfDay(new Date('2022-07-02T12:00:00Z')))
    expect(bigNumberQuery.endDate()).toEqual(startOfDay(new Date('2022-07-09T12:00:00Z')))

    // Response granularity should be the length of the timeframe (assuming no DST transition).
    expect(bigNumberQuery.granularitySeconds()).toBe(7 * 24 * 60 * 60)
  })

  it('calculates start, end, and granularity for delta queries', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY))

    // Data granularity is simulated to be daily, so we expect to round to the start of the day.
    expect(deltaQuery.startDate()).toEqual(startOfDay(new Date('2022-06-25T12:00:00Z')))
    expect(deltaQuery.endDate()).toEqual(startOfDay(new Date('2022-07-09T12:00:00Z')))

    // Response granularity should be the length of the original timeframe.
    expect(deltaQuery.granularitySeconds()).toBe(7 * 24 * 60 * 60)

    // Sanity check
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(14 * 24 * 60 * 60)
  })
})

describe('non-timeseries queries with custom timeframes', () => {
  it('handles unary queries with short custom timeframes', () => {
    const unaryQuery = new UnaryQueryTime(
      datePickerSelectionToTimeframe({
        start: new Date('2022-10-05T12:00:00Z'),
        end: new Date('2022-10-06T12:00:00Z'),
        timePeriodsKey: 'custom',
      }))

    // Data granularity is forced to be daily for custom timeframes, so we expect to round to the start of the day.
    expect(unaryQuery.startDate()).toEqual(startOfDay(new Date('2022-10-05T12:00:00Z')))
    expect(unaryQuery.endDate()).toEqual(startOfDay(new Date('2022-10-07T12:00:00Z')))

    // Response granularity should be the length of the original timeframe.
    expect(unaryQuery.granularitySeconds()).toBe(2 * 24 * 60 * 60)

    // Sanity check
    expect(unaryQuery.endSeconds() - unaryQuery.startSeconds()).toBe(2 * 24 * 60 * 60)
  })

  it('handles delta queries with a one-day custom timeframe', () => {
    const deltaQuery = new DeltaQueryTime(
      datePickerSelectionToTimeframe({
        start: new Date('2022-10-05T12:00:00Z'),
        end: new Date('2022-10-05T12:00:00Z'),
        timePeriodsKey: 'custom',
      }))

    // Data granularity is forced to be daily for custom timeframes, so we expect to round to the start of the day.
    // This is a delta query, so the calculated start date should be 24 hours before the given start date.
    expect(deltaQuery.startDate()).toEqual(startOfDay(new Date('2022-10-04T12:00:00Z')))
    expect(deltaQuery.endDate()).toEqual(startOfDay(new Date('2022-10-06T12:00:00Z')))

    // Response granularity should be the length of the original timeframe.
    expect(deltaQuery.granularitySeconds()).toBe(24 * 60 * 60)

    // Sanity check
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(2 * 24 * 60 * 60)
  })

  it('handles delta queries with long custom timeframes', () => {
    const deltaQuery = new DeltaQueryTime(
      datePickerSelectionToTimeframe({
        start: new Date('2022-09-01T12:00:00Z'),
        end: new Date('2022-09-30T12:00:00Z'),
        timePeriodsKey: 'custom',
      }))

    // Data granularity is forced to be daily, so we expect to round to the start of the day.
    expect(deltaQuery.startDate()).toEqual(startOfDay(new Date('2022-08-02T12:00:00Z')))
    expect(deltaQuery.endDate()).toEqual(startOfDay(new Date('2022-10-01T12:00:00Z')))

    // Response granularity should be the length of the original timeframe.
    expect(deltaQuery.granularitySeconds()).toBe(30 * 24 * 60 * 60)

    // Sanity check
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(60 * 24 * 60 * 60)
  })
})

// The following tests only work if run in a timezone that observes DST.
// US Eastern chosen in order to make the dates work.
const supportsDst = process.env.TZ === 'US/Eastern'

// runIf (certain_condition) is not supported in Jest; use this pattern instead:
// https://github.com/facebook/jest/issues/3652#issuecomment-385262455
const runDstTest = supportsDst ? describe : describe.skip

runDstTest('daylight savings time: spring', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const fakeNow = new Date('2023-03-31T12:00:00Z')

    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // Test below runs only for DST timezones
  it('maintains consistent timeframe length across spring DST transition', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY))
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY))

    expect(unaryQuery.endDate()).toEqual(startOfDay(new Date('2023-04-01T12:00:00.000Z')))
    expect(deltaQuery.endDate()).toEqual(startOfDay(new Date('2023-04-01T12:00:00.000Z')))

    // We lose an hour in the spring, meaning the start date is an hour earlier than we expect it to be.
    expect(unaryQuery.startDate()).toEqual(add(startOfDay(new Date('2023-03-02T12:00:00.000Z')), { hours: -1 }))
    expect(deltaQuery.startDate()).toEqual(add(startOfDay(new Date('2023-01-31T12:00:00.000Z')), { hours: -1 }))

    expect(unaryQuery.endSeconds() - unaryQuery.startSeconds()).toBe(60 * 60 * 24 * 30)
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(60 * 60 * 24 * 30 * 2)

    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('determines a correct trend query across multiple transitions', () => {
    const start = new Date(1702832400000) // 2023-12-17, noon Eastern time
    const end = new Date(1727798400000) // 2024-10-01, noon Eastern time
    const timeframeLength = (end.getTime() - start.getTime()) / 1000

    const timePeriod = new Timeframe({
      key: 'custom',
      timeframeText: 'custom',
      display: 'custom',
      startCustom: start,
      endCustom: end,
      timeframeLength: () => timeframeLength,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['free', 'plus', 'enterprise'],
    })

    const unaryQuery = new UnaryQueryTime(timePeriod, 'US/Eastern')

    expect(unaryQuery.startMs()).toEqual(1702789200000) // 2023-12-17, midnight Eastern time
    expect(unaryQuery.endMs()).toEqual(1727841600000) // 2024-10-02, midnight Eastern time

    // The length of the above timespan.  Due to DST, it's 1 hour shy of 290 days.
    const expectedGranularity = 1727841600000 - 1702789200000

    expect(unaryQuery.granularityMs()).toEqual(expectedGranularity)

    const deltaQuery = new DeltaQueryTime(timePeriod, 'US/Eastern')

    expect(deltaQuery.startMs()).toEqual(1677736800000) // 2023-03-02, 1 AM Eastern time
    expect(deltaQuery.endMs()).toEqual(1727841600000) // 2024-10-02, midnight Eastern time

    // Exactly half of the full delta timespan.
    expect(deltaQuery.granularityMs()).toEqual(expectedGranularity)
  })
})

runDstTest('daylight savings time: fall', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const fakeNow = new Date('2023-11-10T12:00:00Z')
    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // Test below runs only for DST timezones
  it('maintains consistent timeframe length across fall DST transition', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY))
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY))
    expect(unaryQuery.endDate()).toEqual(startOfDay(new Date('2023-11-11T12:00:00.000Z')))
    expect(deltaQuery.endDate()).toEqual(startOfDay(new Date('2023-11-11T12:00:00.000Z')))

    // We gain an hour in the fall, meaning the start date is an hour later than we expect it to be.
    expect(unaryQuery.startDate()).toEqual(add(startOfDay(new Date('2023-11-04T12:00:00.000Z')), { hours: 1 }))
    expect(deltaQuery.startDate()).toEqual(add(startOfDay(new Date('2023-10-28T12:00:00.000Z')), { hours: 1 }))
    expect(unaryQuery.endSeconds() - unaryQuery.startSeconds()).toBe(60 * 60 * 24 * 7)
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(60 * 60 * 24 * 7 * 2)
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })
})

runUtcTest('UTC: fine granularity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const fakeNow = new Date('2023-11-09T01:17:32Z')
    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles fine granularity in rounding - timeseries, 5 minutely', () => {
    const tsQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.ONE_DAY), 'fiveMinutely', undefined, undefined, true)

    expect(tsQuery.endDate()).toEqual(new Date('2023-11-09T01:20:00Z'))
    expect(tsQuery.startDate()).toEqual(new Date('2023-11-08T01:20:00Z'))
  })

  it('handles fine granularity in rounding - timeseries, hourly', () => {
    const tsQuery = new TimeseriesQueryTime(getTimePeriod(TimeframeKeys.THIRTY_DAY), 'hourly', undefined, undefined, true)

    expect(tsQuery.endDate()).toEqual(new Date('2023-11-09T02:00:00Z'))
    expect(tsQuery.startDate()).toEqual(new Date('2023-10-10T02:00:00Z'))
  })

  it('handles data granularity overrides - unary, daily', () => {
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), undefined, 'daily')

    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-10T00:00:00Z'))
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-03T00:00:00Z'))
  })

  it('handles data granularity overrides - delta, daily', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), undefined, 'daily')

    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-10T00:00:00Z'))
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-27T00:00:00Z'))
  })
})

runUtcTest('UTC: timezone handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const fakeNow = new Date('2023-11-09T01:00:00Z') // This is 2023-11-08T20:00:00 Eastern.
    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates relative dates in a local, negative-offset timezone', () => {
    // Sanity check
    expect(formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd HH:mm:ssXXX')).toBe('2023-11-08 20:00:00-05:00')

    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), 'US/Eastern')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), 'US/Eastern')

    // Unary and delta end times should be the start of the _next_ day in Eastern time.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))

    // The Eastern timezone gains an hour in the fall.  UTC does not, so this should be the same hour as before.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-02T05:00:00.000Z'))
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-26T05:00:00.000Z'))
    expect(unaryQuery.endSeconds() - unaryQuery.startSeconds()).toBe(60 * 60 * 24 * 7)
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(60 * 60 * 24 * 7 * 2)
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates current week in a local, negative-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK), 'US/Eastern')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK), 'US/Eastern')

    // Unary and delta end times should be rounded up to the nearest day.
    // (Total length: 3 full days)
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))

    // Unary start times should be the start of the first day of the current week in Eastern time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-06T05:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous week.
    // This timeperiod isn't guaranteed cover integer numbers of days, because days might be different lengths
    // around DST boundaries.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-11-03T05:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates previous week in a local, negative-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK), 'US/Eastern')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK), 'US/Eastern')

    // Unary and delta end times should be the start of the current week.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-06T05:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-06T05:00:00.000Z'))

    // Unary start times should be the start of the first day of the previous week in Eastern time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-10-30T04:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous week.
    // The timeframe is 7 days and 1 hour due to the DST transition.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-23T03:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates current month in a local, negative-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'US/Eastern')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'US/Eastern')

    // Unary and delta end times should be rounded up to the nearest day.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T05:00:00.000Z'))

    // Unary start times should be the start of the first day of the current month in Eastern time.
    // Unlike "last 7 days", this one tracks the DST change; it's based on days rather than hours.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-01T04:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous month.
    // The timeframe is 7 days and 1 hour due to the DST transition.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-24T03:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates previous month in a local, negative-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'US/Eastern')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'US/Eastern')

    // Unary and delta end times should be the start of the current month.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-01T04:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-01T04:00:00.000Z'))

    // Unary and delta start times should be the start of the first day of the previous month in Eastern time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-10-01T04:00:00.000Z'))
    expect(deltaQuery.startDate()).toEqual(new Date('2023-08-31T04:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates relative dates in a local, positive-offset timezone', () => {
    // Sanity check
    expect(formatInTimeZone(new Date(), 'Europe/Sofia', 'yyyy-MM-dd HH:mm:ssXXX')).toBe('2023-11-09 03:00:00+02:00')

    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), 'Europe/Sofia')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.SEVEN_DAY), 'Europe/Sofia')

    // Unary and delta end times should be the start of the _next_ day in Bulgarian time.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))

    // This timezone doesn't have a DST transition within this date range.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-02T22:00:00.000Z'))
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-26T22:00:00.000Z'))
    expect(unaryQuery.endSeconds() - unaryQuery.startSeconds()).toBe(60 * 60 * 24 * 7)
    expect(deltaQuery.endSeconds() - deltaQuery.startSeconds()).toBe(60 * 60 * 24 * 7 * 2)
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates current week in a local, positive-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK), 'Europe/Sofia')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_WEEK), 'Europe/Sofia')

    // Unary and delta end times should be rounded up to the nearest day.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the current week in Bulgarian time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-11-05T22:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous week.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-11-01T22:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates previous week in a local, positive-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK), 'Europe/Sofia')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_WEEK), 'Europe/Sofia')

    // Unary and delta end times should be the start of the current week.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-05T22:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-05T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the previous week in Bulgarian time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-10-29T22:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous week.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-22T22:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates current month in a local, positive-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'Europe/Sofia')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'Europe/Sofia')

    // Unary and delta end times should be rounded up to the nearest day.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-11-09T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the current month in Bulgarian time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-10-31T22:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous month.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-10-22T22:00:00.000Z'))
    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })

  it('calculates previous month in a local, positive-offset timezone', () => {
    const deltaQuery = new DeltaQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'Europe/Sofia')
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'Europe/Sofia')

    // Unary and delta end times should be the start of the current month.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-10-31T22:00:00.000Z'))
    expect(deltaQuery.endDate()).toEqual(new Date('2023-10-31T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the previous month in Bulgarian time.
    // Bulgaria has a DST transition on 10/28, so this is now a different hour offset.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-09-30T21:00:00.000Z'))

    // Delta start times are tricky; the existing behavior is to just match the length of the timeframe rather than
    // actually comparing to the full previous month.
    // Bulgaria's DST change happens in this window, so the actual timeframe length is 31 days and 1 hour.
    expect(deltaQuery.startDate()).toEqual(new Date('2023-08-30T20:00:00.000Z'))

    expect(deltaQuery.granularitySeconds()).toBe(unaryQuery.granularitySeconds())
  })
})

runUtcTest('UTC: month boundary edge cases, negative offset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const fakeNow = new Date('2023-11-01T01:00:00Z')
    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles current month correctly', () => {
    // Sanity check
    expect(formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd HH:mm:ssXXX')).toBe('2023-10-31 21:00:00-04:00')

    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'US/Eastern')

    // Unary and delta end times should be rounded up to the nearest day, which happens to be the end of the month.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-11-01T04:00:00.000Z'))

    // Unary start times should be the start of the first day of the current month in Eastern time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-10-01T04:00:00.000Z'))
  })

  it('handles previous month correctly', () => {
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'US/Eastern')

    // Unary and delta end times should be the first day of this month.
    expect(unaryQuery.endDate()).toEqual(new Date('2023-10-01T04:00:00.000Z'))

    // Unary start times should be the start of the first day of the previous month in Eastern time.
    expect(unaryQuery.startDate()).toEqual(new Date('2023-09-01T04:00:00.000Z'))
  })
})

runUtcTest('UTC: month boundary edge cases, positive offset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Egypt did not observe DST for a few years around 2020.
    const fakeNow = new Date('2020-11-30T23:00:00Z')
    standardizeTimezone(fakeNow)
    vi.setSystemTime(fakeNow)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles current month correctly', () => {
    // Sanity check
    expect(formatInTimeZone(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm:ssXXX')).toBe('2020-12-01 01:00:00+02:00')

    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.CURRENT_MONTH), 'Africa/Cairo')

    // Unary and delta end times should be rounded up to the nearest day.
    expect(unaryQuery.endDate()).toEqual(new Date('2020-12-01T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the current month in Cairo time.
    expect(unaryQuery.startDate()).toEqual(new Date('2020-11-30T22:00:00.000Z'))
  })

  it('handles previous month correctly', () => {
    const unaryQuery = new UnaryQueryTime(getTimePeriod(TimeframeKeys.PREVIOUS_MONTH), 'Africa/Cairo')

    // Unary and delta end times should be the first day of this month.
    expect(unaryQuery.endDate()).toEqual(new Date('2020-11-30T22:00:00.000Z'))

    // Unary start times should be the start of the first day of the previous month in Cairo time.
    expect(unaryQuery.startDate()).toEqual(new Date('2020-10-31T22:00:00.000Z'))
  })
})
