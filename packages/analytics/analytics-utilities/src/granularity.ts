import type { DruidGranularity } from './types'
import { GranularityKeys } from './types'
import { getTimezoneOffset } from 'date-fns-tz'

// Units are milliseconds, which are what Druid expects.
export const Granularities = {
  [GranularityKeys.SECONDLY]: 1000,
  [GranularityKeys.MINUTELY]: 60 * 1000,
  [GranularityKeys.HOURLY]: 60 * 60 * 1000,
  [GranularityKeys.DAILY]: 60 * 60 * 24 * 1000,
  [GranularityKeys.WEEKLY]: 60 * 60 * 24 * 7 * 1000,
}

export function granularitiesToOptions(
  values: GranularityKeys[],
  i18n: { t: (v: string) => string },
) {
  return values.map((v) => ({
    value: v,
    label: i18n.t(`configuration.vitals.reports.granularity.${v}`),
  }))
}

export function granularityMsToQuery(
  granularity: number | null,
  origin?: string,
): DruidGranularity | null {
  if (granularity) {
    return {
      duration: granularity,
      type: 'duration',
      origin,
    }
  }

  return null
}

export function msToGranularity(ms?: number): GranularityKeys | null {
  if (!ms) {
    return null
  }

  // Note that this folds weird granularity values into known values.
  const key = Object.values(GranularityKeys).find((k) => ms <= Granularities[k])

  return key || null
}

function toNearestTimeGrain(
  op: (x: number) => number,
  date: Date,
  granularity: GranularityKeys,
  tz?: string,
): Date {
  // Days and weeks need special handling because naively trying to `ceil` or `floor` them results in a date ending
  // in midnight UTC, whereas as of now we want dates ending in midnight local time.
  // Note: right now we treat daily and weekly granularities the same way, because it's OK to request an
  // incomplete week (i.e., if it's currently Monday at noon, it's OK to request data up to Tuesday midnight for the current week).
  // Druid will just limit its query range accordingly.
  const granularityMs = Granularities[granularity]
  let tzOffsetMs = 0

  if (granularityMs >= Granularities[GranularityKeys.DAILY]) {
    if (tz) {
      tzOffsetMs = -getTimezoneOffset(tz, date)
    } else {
      tzOffsetMs = date.getTimezoneOffset() * 60 * 1000
    }
  }

  return new Date(op((date.getTime() - tzOffsetMs) / granularityMs) * granularityMs + tzOffsetMs)
}

export function floorToNearestTimeGrain(date: Date, granularity: GranularityKeys, tz?: string): Date {
  return toNearestTimeGrain(Math.floor, date, granularity, tz)
}

export function ceilToNearestTimeGrain(date: Date, granularity: GranularityKeys, tz?: string): Date {
  return toNearestTimeGrain(Math.ceil, date, granularity, tz)
}
