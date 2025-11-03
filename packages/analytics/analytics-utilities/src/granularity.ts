import type { DruidGranularity, GranularityValues } from './types'
import { granularityValues } from './types'
import { getTimezoneOffset } from 'date-fns-tz'

// Units are milliseconds, which are what Druid expects.
export const Granularities = {
  secondly: 1000,
  tenSecondly: 10 * 1000,
  thirtySecondly: 30 * 1000,
  minutely: 60 * 1000,
  fiveMinutely: 5 * 60 * 1000,
  tenMinutely: 10 * 60 * 1000,
  thirtyMinutely: 30 * 60 * 1000,
  hourly: 60 * 60 * 1000,
  twoHourly: 2 * 60 * 60 * 1000,
  twelveHourly: 12 * 60 * 60 * 1000,
  daily: 60 * 60 * 24 * 1000,
  weekly: 60 * 60 * 24 * 7 * 1000,
  trend: 0,
}

export function granularitiesToOptions(
  values: GranularityValues[],
  i18n: { t: (v: string) => string },
) {
  return values.map((v) => ({
    value: v,
    label: i18n.t(`configuration.vitals.reports.granularity.${v}`),
  }))
}

export function granularityMsToQuery(
  granularity: number,
  origin: string,
): DruidGranularity {
  return {
    duration: granularity,
    type: 'duration',
    origin,
  }
}

export function msToGranularity(ms?: number): GranularityValues | null {
  if (!ms) {
    return null
  }

  // Note that this folds weird granularity values into known values.
  const key = granularityValues.find((k: GranularityValues) => ms <= Granularities[k])

  return key || null
}

function toNearestTimeGrain(
  op: (x: number) => number,
  date: Date,
  granularity: GranularityValues,
  tz?: string,
): Date {
  // Days and weeks need special handling because naively trying to `ceil` or `floor` them results in a date ending
  // in midnight UTC, whereas as of now we want dates ending in midnight local time.
  // Note: right now we treat daily and weekly granularities the same way, because it's OK to request an
  // incomplete week (i.e., if it's currently Monday at noon, it's OK to request data up to Tuesday midnight for the current week).
  // Druid will just limit its query range accordingly.
  const granularityMs = Granularities[granularity]
  let tzOffsetMs = 0

  if (granularityMs >= Granularities.daily) {
    if (tz) {
      tzOffsetMs = -getTimezoneOffset(tz, date)
    } else {
      tzOffsetMs = date.getTimezoneOffset() * 60 * 1000
    }
  }

  return new Date(op((date.getTime() - tzOffsetMs) / granularityMs) * granularityMs + tzOffsetMs)
}

export function floorToNearestTimeGrain(date: Date, granularity: GranularityValues, tz?: string): Date {
  return toNearestTimeGrain(Math.floor, date, granularity, tz)
}

export function ceilToNearestTimeGrain(date: Date, granularity: GranularityValues, tz?: string): Date {
  return toNearestTimeGrain(Math.ceil, date, granularity, tz)
}
