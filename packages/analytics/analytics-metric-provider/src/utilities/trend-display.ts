import {
  IndeterminateSmallIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@kong/icons'
import type {
  IndeterminateSmallIcon as GenericIcon,
} from '@kong/icons'
import { DEFAULT_KEY, ERROR_RATE_DIMENSION } from '../constants'
import type { ChronologicalMappedMetrics } from '../types'
import type {
  ExploreResultV4,
} from '@kong-ui-public/analytics-utilities'

// Used to render a percentage display (eg: 30.97%)
export const DECIMAL_DISPLAY = 2

// Rounding precision for raw values (eg: 0.3097)
export const DECIMAL_ROUNDING_PRECISION = DECIMAL_DISPLAY + 2

/**
 * Beneficial increase (eg: Traffic) is considered good.
 * Detrimental increase (eg: Error traffic) is considered bad, and behave in the opposite manner.
 * @param {number} delta - A numeric representation of week-to-week change
 * @param {Boolean} thisIsBad - Flag to determine whether change is beneficial or detrimental
 * @returns {string}
 */
export const changePolarity = (delta: number, hasTrendAccess: boolean, thisIsBad:boolean = false): number => {
  let polarity = (!hasTrendAccess || Number(delta.toFixed(DECIMAL_ROUNDING_PRECISION)) === 0)
    ? 0
    : Number(delta.toFixed(DECIMAL_ROUNDING_PRECISION)) > 0
      ? 1
      : -1

  // Flip the bit if change is detrimental
  if (thisIsBad) {
    polarity *= -1
  }

  return polarity
}

/**
 * Determines the trend value to be displayed by the metric card
 * @param {number} delta The change amount during the given time period.  Assumed to be a percentage; e.g., delta = 0.1 will be rendered as '10.00%'.
 * @param {Boolean} hasTrendAccess Whether the user's Tier allows it
 * @returns {string}
 */
export const metricChange = (delta: number, hasTrendAccess: boolean, fallback: string): string => {
  return hasTrendAccess
    ? `${Math.abs(delta * 100).toFixed(DECIMAL_DISPLAY)}%`
    : fallback
}

// Determine the percent change between `curr` and `prev`; avoid dividing by 0.
export const calculateChange = (curr: number, prev: number) => {
  if (prev === 0) {
    // If we would calculate a +Infinity change, instead just say 0% to avoid ugliness.
    return 0
  } else {
    return curr / prev - 1
  }
}

/**
 * Determines whether to display an upward or downward trend, or no change
 */
export const defineIcon = (polarity: number, thisIsBad: boolean = false): typeof GenericIcon => {
  if (thisIsBad) {
    polarity *= -1
  }

  return (polarity > 0)
    ? TrendUpIcon
    : polarity < 0
      ? TrendDownIcon
      : IndeterminateSmallIcon
}

const setMetric = (result: ChronologicalMappedMetrics, time: 'previous' | 'current', topLevelKey: string | typeof DEFAULT_KEY, secondLevelKey: string | typeof DEFAULT_KEY, metricValue: number) => {
  if (!result[time][topLevelKey]) {
    result[time][topLevelKey] = {} as Record<string | typeof DEFAULT_KEY, number>
  }
  result[time][topLevelKey][secondLevelKey] = metricValue
}

export function buildDeltaMapping(result: ExploreResultV4, withTrend: boolean, {
  topLevelKey = DEFAULT_KEY,
  secondLevelKey = DEFAULT_KEY,
}: {
  topLevelKey?: string | typeof DEFAULT_KEY
  secondLevelKey?: string | typeof DEFAULT_KEY
} = {}): ChronologicalMappedMetrics {
  // We should always have metric names in the result; if they're not present, just pick something that won't crash.
  const metricName = result.meta.metric_names?.[0] || ''

  // Figure out the first expected timestamp.
  const queriedStartTime = new Date(result.meta.start).getTime()

  // We only ever have 2 dimensions in the response if the second dimension is STATUS_CODE_GROUPED.
  // TIME doesn't show up in the response.
  // Assert that this is the case; raise a reportable error if not.
  const dimensionNames = Object.keys(result.meta.display || {})
  const hasErrorRateDimension = !!dimensionNames.find(k => k === ERROR_RATE_DIMENSION)
  const keyDimension = dimensionNames.find(k => k !== ERROR_RATE_DIMENSION)

  if (dimensionNames.length > 2 || (dimensionNames.length > 1 && !hasErrorRateDimension)) {
    console.error("Don't know how to work with provided dimensions:", dimensionNames)
    return {
      previous: { [topLevelKey]: { [secondLevelKey]: 0 } },
      current: { [topLevelKey]: { [secondLevelKey]: 0 } },
    } as ChronologicalMappedMetrics
  }

  // Go through each record and add it to the correct group.
  // Explore always returns results sorted in ascending order by time.
  return result.data.reduce<ChronologicalMappedMetrics>((result, record) => {
    const metricValue = record.event[metricName] as number

    // If we have dimensions, then index the results based on the dimension name.
    // If we don't have dimensions, insert a synthetic key (DEFAULT_KEY).
    const newTopLevelKey = keyDimension ? record.event[keyDimension] as string : topLevelKey

    // If we have the error rate key, then index the 2nd level results based on that.
    // Otherwise, insert a synthetic key (DEFAULT_KEY).
    const newSecondLevelKey = hasErrorRateDimension ? record.event[ERROR_RATE_DIMENSION] as string : secondLevelKey

    // The records are in ascending order, so the first record is the earliest.
    // If the timestamp of the current record is the same as the query start date, it belongs to
    // the previous group, otherwise it belongs to the current group.
    if (new Date(record.timestamp).getTime() === queriedStartTime && withTrend) {
      setMetric(result, 'previous', newTopLevelKey, newSecondLevelKey, metricValue)
    } else {
      setMetric(result, 'current', newTopLevelKey, newSecondLevelKey, metricValue)
    }

    return result
  }, {
    previous: {},
    current: {},
  } as ChronologicalMappedMetrics)
}

