import type { GranularityValues } from './types'
import { granularityValues } from './types'

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

export function msToGranularity(ms?: number): GranularityValues | null {
  if (!ms) {
    return null
  }

  // Note that this folds weird granularity values into known values.
  const key = granularityValues.find((k: GranularityValues) => ms <= Granularities[k])

  return key || null
}
