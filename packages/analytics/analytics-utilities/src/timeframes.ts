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
  GranularityKeys,
  TimeframeKeys,
} from './types'

import type {
  DatePickerSelection,
  TimeframeOptions,
  TimePeriod,
} from './types'
import { getTimezoneOffset, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

const adjustForTz = (d: Date, tz: string) => {
  // Adjust the given date by the given TZ offset.
  return new Date(d.getTime() - getTimezoneOffset(tz, d))
}

export class Timeframe {
  readonly timeframeText: string

  readonly key: string

  readonly display: string

  readonly timeframeLength: () => number

  readonly allowedTiers: Array<string>

  // defaultResponseGranularity tracks which of the allowed granularities is picked for a given
  // timeframe if the user does not or cannot specify a granularity.
  readonly defaultResponseGranularity: GranularityKeys

  // dataGranularity tracks the granularity of the available data on the server for a specific timeframe.
  // As of writing, it's always the same as the default response granularity, but it may not always be.
  // It controls how timeframes are rounded to ensure complete time buckets from the server.
  readonly dataGranularity: GranularityKeys

  // isRelative impacts whether we take the `floor` or the `ceil` of the start time.
  // If the time range is relative, we want the ceil -- because we take the ceil of the
  // end time to make sure we're showing all the data we can for the last time bucket.
  // If the time range is absolute, we want the floor -- because otherwise we wouldn't be including
  // the first time bucket.
  readonly isRelative: boolean

  private _startCustom?: Date

  private _endCustom?: Date

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

  allowedGranularities() {
    const allowedValues: Set<GranularityKeys> = new Set()
    const hours = this.maximumTimeframeLength() / 3600

    // Minutely is allowed for under 6 hours.
    if (hours <= 6) {
      allowedValues.add(GranularityKeys.MINUTELY)
    }

    // Hourly is allowed for 1 week and under, as long as it's more than just 1 hour.
    if (hours >= 2 && hours <= 7 * 24) {
      allowedValues.add(GranularityKeys.HOURLY)
    }

    // Daily is allowed for everything over 2 days.
    if (hours >= 2 * 24) {
      allowedValues.add(GranularityKeys.DAILY)
    }

    // Weekly is allowed for everything over 2 weeks.
    if (hours >= 2 * 24 * 14) {
      allowedValues.add(GranularityKeys.WEEKLY)
    }

    return allowedValues
  }

  protected tzAdjustedDate(tz?: string): Date {
    if (!tz) {
      return new Date()
    }

    // Take `new Date()` and adjust it so that it's within the given TZ
    // instead of the current environment's TZ.
    const tzNeutral = zonedTimeToUtc(new Date(), (new Intl.DateTimeFormat()).resolvedOptions().timeZone)
    return utcToZonedTime(tzNeutral, tz)
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
      defaultResponseGranularity: GranularityKeys.MINUTELY,
      dataGranularity: GranularityKeys.MINUTELY,
      isRelative: true,
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.ONE_HOUR,
    new Timeframe({
      key: TimeframeKeys.ONE_HOUR,
      display: 'Last hour',
      timeframeText: 'One hour',
      timeframeLength: () => 60 * 60 * 1,
      defaultResponseGranularity: GranularityKeys.MINUTELY,
      dataGranularity: GranularityKeys.MINUTELY,
      isRelative: true,
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.SIX_HOUR,
    new Timeframe({
      key: TimeframeKeys.SIX_HOUR,
      display: 'Last 6 hours',
      timeframeText: '6 hours',
      timeframeLength: () => 60 * 60 * 6,
      defaultResponseGranularity: GranularityKeys.HOURLY,
      dataGranularity: GranularityKeys.HOURLY,
      isRelative: true,
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.TWELVE_HOUR,
    new Timeframe({
      key: TimeframeKeys.TWELVE_HOUR,
      display: 'Last 12 hours',
      timeframeText: '12 hours',
      timeframeLength: () => 60 * 60 * 12,
      defaultResponseGranularity: GranularityKeys.HOURLY,
      dataGranularity: GranularityKeys.HOURLY,
      isRelative: true,
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.ONE_DAY,
    new Timeframe({
      key: TimeframeKeys.ONE_DAY,
      display: 'Last 24 hours',
      timeframeText: '24 hours',
      timeframeLength: () => 60 * 60 * 24,
      defaultResponseGranularity: GranularityKeys.HOURLY,
      dataGranularity: GranularityKeys.HOURLY,
      isRelative: true,
      allowedTiers: ['free', 'trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.SEVEN_DAY,
    new Timeframe({
      key: TimeframeKeys.SEVEN_DAY,
      display: 'Last 7 days',
      timeframeText: '7 days',
      timeframeLength: () => 60 * 60 * 24 * 7,
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
      isRelative: true,
      allowedTiers: ['trial', 'plus', 'enterprise'],
    }),
  ],
  [
    TimeframeKeys.THIRTY_DAY,
    new Timeframe({
      key: TimeframeKeys.THIRTY_DAY,
      display: 'Last 30 days',
      timeframeText: '30 days',
      timeframeLength: () => 60 * 60 * 24 * 30,
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
      isRelative: true,
      allowedTiers: ['trial', 'plus', 'enterprise'],
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
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
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
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
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
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
      isRelative: false,
      allowedTiers: ['plus', 'enterprise'],
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
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
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
    datePickerSelection.timePeriodsKey && TimePeriods.get(datePickerSelection.timePeriodsKey)

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
      defaultResponseGranularity: GranularityKeys.DAILY,
      dataGranularity: GranularityKeys.DAILY,
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
