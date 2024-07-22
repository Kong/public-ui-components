import {
  IndeterminateSmallIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@kong/icons'
import type {
  IndeterminateSmallIcon as GenericIcon,
} from '@kong/icons'

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
