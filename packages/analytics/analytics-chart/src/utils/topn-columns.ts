/**
 * Legacy TopNTable helpers, retained until the deprecated component is removed.
 * Dashboard TopN mapping now lives in dashboard-renderer; generic cell
 * presentation lives in table-data-grid. New code should use those components
 * rather than importing these internal helpers.
 */

import type { TopNColumnOptions } from '@kong-ui-public/analytics-utilities'

/** @deprecated Retained only for the deprecated TopNTable component. */
export type TopNColumnOptionsMap = Record<string, TopNColumnOptions>

/** @deprecated Retained only for the deprecated TopNTable component. */
export type TopNColumnStats = {
  sum: number
  max: number
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export type TopNThresholdType = 'warning' | 'error'

type TopNThreshold = NonNullable<TopNColumnOptions['thresholds']>[number]

/** @deprecated Retained only for the deprecated TopNTable component. */
export const getColumnOptions = (options: TopNColumnOptionsMap | undefined, key: string): TopNColumnOptions | undefined => {
  if (!options || !key) {
    return undefined
  }

  const lowerKey = key.toLowerCase()

  return options[key] ?? Object.entries(options).find(([optionKey]) => optionKey.toLowerCase() === lowerKey)?.[1]
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const num = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(num) ? num : null
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export const getColumnStats = (values: Array<number | null>): TopNColumnStats => {
  return values.reduce<TopNColumnStats>((stats, value) => {
    if (value === null) {
      return stats
    }

    return {
      sum: stats.sum + value,
      max: Math.max(stats.max, value),
    }
  }, { sum: 0, max: 0 })
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export const getRelativeValue = (value: number, stats: TopNColumnStats): number | null => {
  return stats.sum > 0 ? value / stats.sum : null
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export const getBarRatio = (value: number, stats: TopNColumnStats, scale: TopNColumnOptions['bar']): number => {
  const denominator = scale === 'relative' ? stats.sum : stats.max

  if (denominator <= 0) {
    return 0
  }

  return Math.min(Math.max(value / denominator, 0), 1)
}

/** @deprecated Retained only for the deprecated TopNTable component. */
export const getThresholdType = (value: number, thresholds: TopNThreshold[] | undefined): TopNThresholdType | undefined => {
  const crossed = (thresholds ?? []).filter((threshold) => value >= threshold.value)

  if (!crossed.length) {
    return undefined
  }

  const highest = Math.max(...crossed.map((threshold) => threshold.value))
  const atHighest = crossed.filter((threshold) => threshold.value === highest)

  return atHighest.some((threshold) => threshold.type === 'error') ? 'error' : 'warning'
}
