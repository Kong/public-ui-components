import {
  addDays,
  getDaysInMonth,
  hoursToSeconds,
  minutesToHours,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

import {
  TimeframeKeys,
} from './types'

import type {
  DatePickerSelection,
  TimeframeOptions,
  TimePeriod,
  RelativeTimeRangeValuesV4, TimeRangeV4,
  GranularityValues,
} from './types'
import { getTimezoneOffset, toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { ITimeframe } from './types/timeframe'
import cloneDeep from 'lodash.clonedeep'

const adjustForTz = (d: Date, tz: string) => {
  // Adjust the given date by the given TZ offset.
  return new Date(d.getTime() - getTimezoneOffset(tz, d))
}

export class Timeframe implements ITimeframe {
  readonly timeframeText: string

  readonly key: RelativeTimeRangeValuesV4 | 'custom'

  readonly display: string

  readonly timeframeLength: () => number

  readonly allowedTiers: string[]

  // defaultResponseGranularity tracks which of the allowed granularities is picked for a given
  // timeframe if the user does not or cannot specify a granularity.
  readonly defaultResponseGranularity: GranularityValues

  // dataGranularity tracks the granularity of the available data on the server for a specific timeframe.
  // As of writing, it's always the same as the default response granularity, but it may not always be.
  // It controls how timeframes are rounded to ensure complete time buckets from the server.
  readonly dataGranularity: GranularityValues

  // isRelative impacts whether we take the `floor` or the `ceil` of the start time.
  // If the time range is relative, we want the ceil -- because we take the ceil of the
  // end time to make sure we're showing all the data we can for the last time bucket.
  // If the time range is absolute, we want the floor -- because otherwise we wouldn't be including
  // the first time bucket.
  readonly isRelative: boolean

  readonly fineGrainedDefaultGranularity?: GranularityValues

  private _startCustom?: Date

  private _endCustom?: Date

  private _allowedGranularitiesOverride?: GranularityValues[]

  constructor(opts: TimeframeOptions) {
    this.display = opts.display
    this.timeframeText = opts.timeframeText
    this.key = opts.key
    this.timeframeLength = opts.timeframeLength
    this.allowedTiers = opts.allowedTiers
    this.defaultResponseGranularity = opts.defaultResponseGranularity
    this.dataGranularity = opts.dataGranularity
    this.isRelative = opts.isRelative
    this._startCustom = opts.startCustom
    this._endCustom = opts.endCustom
    this._allowedGranularitiesOverride = opts.allowedGranularitiesOverride
    this.fineGrainedDefaultGranularity = opts.fineGrainedDefaultGranularity
  }

  // rawEnd does not consider granularity and should not be used directly in queries.
  // Use `new QueryTime(timeframe, granularity?).queryEndSeconds()` instead.
  // eslint-disable-next-line -- `tz` is required because it's used in subclasses.
  rawEnd(_tz?: string): Date {
    return this._endCustom || new Date()
  }

  // rawStart does not consider granularity and should not be used directly in queries.
  // Use `new QueryTime(timeframe, granularity?).queryStartSeconds()` instead.
  // eslint-disable-next-line -- `tz` is required because it's used in subclasses.
  rawStart(_tz?: string): Date {
    return this._startCustom || new Date(this.rawEnd().getTime() - this.timeframeLengthMs())
  }

  timeframeLengthMs() {
    return this.timeframeLength() * 1000
  }

  maximumTimeframeLength() {
    // This is overriden in the variable-length subclasses.
    return this.timeframeLength()
  }

  allowedGranularities(fineGrain?: boolean) {
    if (this._allowedGranularitiesOverride && fineGrain) {
      // Note: queryTime's granularity determination currently expects this to be sorted from fine to coarse.
      return new Set(this._allowedGranularitiesOverride)
    }

    const allowedValues: Set<GranularityValues> = new Set()
    const hours = this.maximumTimeframeLength() / 3600

    // Minutely is allowed for under 6 hours.
    if (hours <= 6) {
      allowedValues.add('minutely')
    }

    // Hourly is allowed for 1 week and under, as long as it's more than just 1 hour.
    if (hours >= 2 && hours <= 7 * 24) {
      allowedValues.add('hourly')
    }

    // Daily is allowed for everything over 2 days.
    if (hours >= 2 * 24) {
      allowedValues.add('daily')
    }

    // Weekly is allowed for everything over 2 weeks.
    if (hours >= 2 * 24 * 14) {
      allowedValues.add('weekly')
    }

    return allowedValues
  }

  cacheKey(): string {
    if (this.key !== 'custom') {
      // Right now, `key === custom` is our flag for whether we're dealing with an absolute or relative timeframe.
      return this.key
    }

    return `${this.rawStart().toISOString()}-${this.rawEnd().toISOString()}`
  }

  v4Query(tz?: string): TimeRangeV4 {
    if (this.key === 'custom') {
      // Right now, `key === custom` is our flag for whether we're dealing with an absolute or relative timeframe.
      return {
        type: 'absolute',
        start: this.rawStart(),
        end: this.rawEnd(),
        tz,
      }
    }

    return {
      type: 'relative',
      time_range: this.key,
      tz,
    }
  }

  protected tzAdjustedDate(tz?: string): Date {
    if (!tz) {
      return new Date()
    }

    // Take `new Date()` and adjust it so that it's within the given TZ
    // instead of the current environment's TZ.
    const tzNeutral = fromZonedTime(new Date(), (new Intl.DateTimeFormat()).resolvedOptions().timeZone)
    return toZonedTime(tzNeutral, tz)
  }
}

class CurrentWeek extends Timeframe {
  rawStart(tz?: string): Date {
    // `startOfWeek` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let thisMonday = startOfWeek(this.tzAdjustedDate(tz), { weekStartsOn: 1 })

    if (tz) {
      thisMonday = adjustForTz(thisMonday, tz)
    }

    return thisMonday
  }

  maximumTimeframeLength() {
    return 60 * 60 * 24 * 7
  }
}

class CurrentMonth extends Timeframe {
  rawStart(tz?: string): Date {
    // `startOfMonth` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let firstOfTheMonth = startOfMonth(this.tzAdjustedDate(tz))

    if (tz) {
      firstOfTheMonth = adjustForTz(firstOfTheMonth, tz)
    }

    return firstOfTheMonth
  }

  maximumTimeframeLength() {
    return 60 * 60 * 24 * 31
  }
}

class CurrentYear extends Timeframe {
  rawStart(tz?: string): Date {
    let firstOfTheYear = new Date(this.tzAdjustedDate(tz).getFullYear(), 0, 1)

    if (tz) {
      firstOfTheYear = adjustForTz(firstOfTheYear, tz)
    }

    return firstOfTheYear
  }

  maximumTimeframeLength() {
    return 60 * 60 * 24 * 366
  }
}

class PreviousWeek extends Timeframe {
  rawEnd(tz?: string): Date {
    // `startOfWeek` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let thisMonday = startOfWeek(this.tzAdjustedDate(tz), { weekStartsOn: 1 })

    if (tz) {
      thisMonday = adjustForTz(thisMonday, tz)
    }

    return thisMonday
  }

  rawStart(tz?: string): Date {
    const date = this.tzAdjustedDate(tz)

    // `startOfWeek` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let lastMonday = startOfWeek(date.setDate(date.getDate() - 7), {
      weekStartsOn: 1,
    })

    if (tz) {
      lastMonday = adjustForTz(lastMonday, tz)
    }

    return lastMonday
  }
}

class PreviousMonth extends Timeframe {
  rawEnd(tz?: string): Date {
    // `startOfMonth` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let thisMonth = startOfMonth(this.tzAdjustedDate(tz))

    if (tz) {
      thisMonth = adjustForTz(thisMonth, tz)
    }

    return thisMonth
  }

  rawStart(tz?: string): Date {
    // `startOfMonth` isn't aware of timezones, so the resulting "start of month" time is in the local timezone.
    let lastMonth = startOfMonth(subMonths(this.tzAdjustedDate(tz), 1))

    if (tz) {
      lastMonth = adjustForTz(lastMonth, tz)
    }

    return lastMonth
  }
}

class PerviousYear extends Timeframe {
  rawEnd(tz?: string): Date {
    let thisYear = new Date(this.tzAdjustedDate(tz).getFullYear(), 0, 1)

    if (tz) {
      thisYear = adjustForTz(thisYear, tz)
    }

    return thisYear
  }

  rawStart(tz?: string): Date {
    let lastYear = new Date(this.tzAdjustedDate(tz).getFullYear() - 1, 0, 1)

    if (tz) {
      lastYear = adjustForTz(lastYear, tz)
    }

    return lastYear
  }
}

// These TimePeriod definitions request a default granularity and can be adjusted
//
// Using <string, any> as a temp workaround for TimePeriods.get() potentially returning `undefined` lint issue.
// This means we opt out of safety checks; similar to this workaround:
//   https://github.com/microsoft/TypeScript/issues/41045#issuecomment-706717682

export const TimePeriods = new Map<string, Timeframe>([
  [
    TimeframeKeys.FIFTEEN_MIN,
    new Timeframe({
      key: TimeframeKeys.FIFTEEN_MIN,
      display: 'Last 15 minutes',
      timeframeText: '15 minutes',
      timeframeLength: () => 60 * 15,
      defaultResponseGranularity: 'minutely',
      dataGranularity: 'minutely',
      isRelative: true,
      fineGrainedDefaultGranularity: 'thirtySecondly',
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['tenSecondly', 'thirtySecondly', 'minutely'],
    }),
  ],
  [
    TimeframeKeys.ONE_HOUR,
    new Timeframe({
      key: TimeframeKeys.ONE_HOUR,
      display: 'Last hour',
      timeframeText: 'One hour',
      timeframeLength: () => 60 * 60 * 1,
      defaultResponseGranularity: 'minutely',
      dataGranularity: 'minutely',
      isRelative: true,
      fineGrainedDefaultGranularity: 'minutely',
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['tenSecondly', 'thirtySecondly', 'minutely', 'fiveMinutely', 'tenMinutely'],
    }),
  ],
  [
    TimeframeKeys.SIX_HOUR,
    new Timeframe({
      key: TimeframeKeys.SIX_HOUR,
      display: 'Last 6 hours',
      timeframeText: '6 hours',
      timeframeLength: () => 60 * 60 * 6,
      defaultResponseGranularity: 'hourly',
      dataGranularity: 'hourly',
      isRelative: true,
      fineGrainedDefaultGranularity: 'fiveMinutely',
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['thirtySecondly', 'minutely', 'fiveMinutely', 'tenMinutely', 'thirtyMinutely', 'hourly'],
    }),
  ],
  [
    TimeframeKeys.TWELVE_HOUR,
    new Timeframe({
      key: TimeframeKeys.TWELVE_HOUR,
      display: 'Last 12 hours',
      timeframeText: '12 hours',
      timeframeLength: () => 60 * 60 * 12,
      defaultResponseGranularity: 'hourly',
      dataGranularity: 'hourly',
      isRelative: true,
      fineGrainedDefaultGranularity: 'tenMinutely',
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['minutely', 'fiveMinutely', 'tenMinutely', 'thirtyMinutely', 'hourly'],
    }),
  ],
  [
    TimeframeKeys.ONE_DAY,
    new Timeframe({
      key: TimeframeKeys.ONE_DAY,
      display: 'Last 24 hours',
      timeframeText: '24 hours',
      timeframeLength: () => 60 * 60 * 24,
      defaultResponseGranularity: 'hourly',
      dataGranularity: 'hourly',
      isRelative: true,
      fineGrainedDefaultGranularity: 'thirtyMinutely',
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['fiveMinutely', 'tenMinutely', 'thirtyMinutely', 'hourly'],
    }),
  ],
  [
    TimeframeKeys.SEVEN_DAY,
    new Timeframe({
      key: TimeframeKeys.SEVEN_DAY,
      display: 'Last 7 days',
      timeframeText: '7 days',
      timeframeLength: () => 60 * 60 * 24 * 7,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: true,
      fineGrainedDefaultGranularity: 'twoHourly',
      allowedTiers: ['trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['thirtyMinutely', 'hourly', 'twoHourly', 'twelveHourly', 'daily'],
    }),
  ],
  [
    TimeframeKeys.THIRTY_DAY,
    new Timeframe({
      key: TimeframeKeys.THIRTY_DAY,
      display: 'Last 30 days',
      timeframeText: '30 days',
      timeframeLength: () => 60 * 60 * 24 * 30,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: true,
      fineGrainedDefaultGranularity: 'twelveHourly',
      allowedTiers: ['trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['hourly', 'twoHourly', 'twelveHourly', 'daily', 'weekly'],
    }),
  ],
  [
    TimeframeKeys.NINETY_DAY,
    new Timeframe({
      key: TimeframeKeys.NINETY_DAY,
      display: 'Last 90 days',
      timeframeText: '90 days',
      timeframeLength: () => 60 * 60 * 24 * 90,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: true,
      fineGrainedDefaultGranularity: 'daily',
      allowedTiers: ['trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['hourly', 'twoHourly', 'twelveHourly', 'daily', 'weekly'],
    }),
  ],
  [
    TimeframeKeys.ONE_HUNDRED_EIGHTY_DAY,
    new Timeframe({
      key: TimeframeKeys.ONE_HUNDRED_EIGHTY_DAY,
      display: 'Last 180 days',
      timeframeText: '180 days',
      timeframeLength: () => 60 * 60 * 24 * 180,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: true,
      fineGrainedDefaultGranularity: 'daily',
      allowedTiers: ['trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['hourly', 'twoHourly', 'twelveHourly', 'daily', 'weekly'],
    }),
  ],
  [
    TimeframeKeys.ONE_YEAR,
    new Timeframe({
      key: TimeframeKeys.ONE_YEAR,
      display: 'Last 365 days',
      timeframeText: '365 days',
      timeframeLength: () => 60 * 60 * 24 * 365,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: true,
      fineGrainedDefaultGranularity: 'daily',
      allowedTiers: ['trial', 'plus', 'enterprise'],
      allowedGranularitiesOverride: ['hourly', 'twoHourly', 'twelveHourly', 'daily', 'weekly'],
    }),
  ],
  [
    TimeframeKeys.CURRENT_WEEK,
    new CurrentWeek({
      key: TimeframeKeys.CURRENT_WEEK,
      display: 'This week',
      timeframeText: 'Week',
      timeframeLength: () => {
        // Monday -> now
        const prevMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
        const end = startOfDay(addDays(new Date(), 1))

        return (end.getTime() - prevMonday.getTime()) / 1000
      },
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      fineGrainedDefaultGranularity: 'twoHourly',
      allowedTiers: ['plus', 'enterprise'],
      allowedGranularitiesOverride: ['thirtyMinutely', 'hourly', 'twoHourly', 'twelveHourly', 'daily'],
    }),
  ],
  [
    TimeframeKeys.CURRENT_MONTH,
    new CurrentMonth({
      key: TimeframeKeys.CURRENT_MONTH,
      display: 'This month',
      timeframeText: 'Month',
      timeframeLength: () => {
        // First of the month -> now
        const firstOfTheMonth = startOfMonth(new Date())
        const end = startOfDay(addDays(new Date(), 1))

        return (end.getTime() - firstOfTheMonth.getTime()) / 1000
      },
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.CURRENT_YEAR,
    new CurrentYear({
      key: TimeframeKeys.CURRENT_YEAR,
      display: 'This year',
      timeframeText: 'Year',
      timeframeLength: () => {
        // Jan 1 -> now
        const firstOfTheYear = new Date(new Date().getFullYear(), 0, 1)
        const end = startOfDay(addDays(new Date(), 1))

        return (end.getTime() - firstOfTheYear.getTime()) / 1000
      },
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.PREVIOUS_WEEK,
    new PreviousWeek({
      key: TimeframeKeys.PREVIOUS_WEEK,
      display: 'Previous week',
      timeframeText: 'Week',
      timeframeLength: () => 60 * 60 * 24 * 7,
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      fineGrainedDefaultGranularity: 'twoHourly',
      allowedTiers: ['plus', 'enterprise'],
      allowedGranularitiesOverride: ['thirtyMinutely', 'hourly', 'twoHourly', 'twelveHourly', 'daily'],
    }),
  ],
  [
    TimeframeKeys.PREVIOUS_MONTH,
    new PreviousMonth({
      key: TimeframeKeys.PREVIOUS_MONTH,
      display: 'Previous month',
      timeframeText: 'Month',
      timeframeLength: () => {
        let offset = 0
        const end = startOfMonth(new Date())
        const start = startOfMonth(subMonths(new Date(), 1))
        if (end.getTimezoneOffset() !== start.getTimezoneOffset()) {
          offset = dstOffsetHours(end, start)
        }

        // Not all months have the same number of days.
        // Current month may be observing DST while previous is not
        // take this into account when calculating the timeframe length for previous month
        return (
          60 * 60 * 24 * getDaysInMonth(new Date().setMonth(new Date().getMonth() - 1)) + hoursToSeconds(offset)
        )
      },
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.PREVIOUS_YEAR,
    new PerviousYear({
      key: TimeframeKeys.PREVIOUS_YEAR,
      display: 'Previous year',
      timeframeText: 'Year',
      timeframeLength: () => {
        // Not all years have the same number of days (leap years).
        const end = new Date(new Date().getFullYear(), 0, 1)
        const start = new Date(new Date().getFullYear() - 1, 0, 1)
        let offset = 0
        if (end.getTimezoneOffset() !== start.getTimezoneOffset()) {
          offset = dstOffsetHours(end, start)
        }

        return 60 * 60 * 24 * (365 + (start.getFullYear() % 4 === 0 ? 1 : 0)) + hoursToSeconds(offset)
      },
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
    }),
  ],
])

export function datePickerSelectionToTimeframe(datePickerSelection: DatePickerSelection): Timeframe {
  const start = new Date(datePickerSelection.start)
  const end = new Date(datePickerSelection.end)
  const timeframeLength = (end.getTime() - start.getTime()) / 1000

  const selectedTimePeriod =
    datePickerSelection.timePeriodsKey && cloneDeep(TimePeriods.get(datePickerSelection.timePeriodsKey))

  // Note: for custom timeframes, the timeframeLength is approximate: due to rounding
  // based on granularity, the actual length will be slightly greater.

  return (
    selectedTimePeriod ||
    new Timeframe({
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
  )
}

export function timeframeToDatepickerSelection(timeframe: Timeframe): DatePickerSelection {
  // Only set `timePeriodsKey` if a relative time frame is chosen
  // Custom time ranges are denoted by the absence of this key
  return {
    ...(timeframe.key !== 'custom' && { timePeriodsKey: timeframe.key }),
    start: timeframe.rawStart(),
    end: timeframe.rawEnd(),
  }
}

export function timeframeToDatepickerTimeperiod(timeframe: Timeframe): TimePeriod {
  // The datepicker needs `start` and `end` functions for its timeperiods.
  return {
    key: timeframe.key,
    display: timeframe.display,
    timeframeText: timeframe.timeframeText,
    timeframeLength: () => timeframe.key, // Used to generate test IDs for the Kongponent.
    start: () => timeframe.rawStart(),
    end: () => timeframe.rawEnd(),
  }
}

export function dstOffsetHours(d1: Date, d2: Date): number {
  return minutesToHours(d1.getTimezoneOffset() - d2.getTimezoneOffset())
}

export const TIMEFRAME_LOOKUP: Record<string, TimeframeKeys> = {
  '15M': TimeframeKeys.FIFTEEN_MIN,
  '1H': TimeframeKeys.ONE_HOUR,
  '6H': TimeframeKeys.SIX_HOUR,
  '12H': TimeframeKeys.TWELVE_HOUR,
  '24H': TimeframeKeys.ONE_DAY,
  '7D': TimeframeKeys.SEVEN_DAY,
  '15m': TimeframeKeys.FIFTEEN_MIN,
  '1h': TimeframeKeys.ONE_HOUR,
  '6h': TimeframeKeys.SIX_HOUR,
  '12h': TimeframeKeys.TWELVE_HOUR,
  '24h': TimeframeKeys.ONE_DAY,
  '7d': TimeframeKeys.SEVEN_DAY,
  '30d': TimeframeKeys.THIRTY_DAY,
  '90d': TimeframeKeys.NINETY_DAY,
  '180d': TimeframeKeys.ONE_HUNDRED_EIGHTY_DAY,
  '365d': TimeframeKeys.ONE_YEAR,
  current_week: TimeframeKeys.CURRENT_WEEK,
  current_month: TimeframeKeys.CURRENT_MONTH,
  current_year: TimeframeKeys.CURRENT_YEAR,
  previous_week: TimeframeKeys.PREVIOUS_WEEK,
  previous_month: TimeframeKeys.PREVIOUS_MONTH,
  previous_year: TimeframeKeys.PREVIOUS_YEAR,
}
