export const DECIMAL_DISPLAY = 2
export const DECIMAL_ROUNDING_PRECISION = DECIMAL_DISPLAY + 0

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
 * @param {number} delta The change amount during the given time period
 * @param {Boolean} hasTrendAccess Whether the user's Tier allows it
 * @returns {string}
 */
export const metricChange = (delta: number, hasTrendAccess: boolean, fallback: string): string => {
  return hasTrendAccess
    ? `${Math.abs(delta).toFixed(DECIMAL_DISPLAY)}%`
    : fallback
}

/**
 * Determines whether to display an upward or downward trend, or no change
 */
export const defineIcon = (polarity: number, thisIsBad: boolean = false): string => {
  if (thisIsBad) {
    polarity *= -1
  }

  return (polarity > 0)
    ? 'arrowUp'
    : polarity < 0
      ? 'arrowDown'
      : 'noData'
}
