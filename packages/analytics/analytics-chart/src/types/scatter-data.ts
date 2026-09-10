import type { Display, ResultMetaBase } from '@kong-ui-public/analytics-utilities'

export interface ScatterDataPoint {
  /**
   * Epoch milliseconds.
   */
  timestamp: number
  /**
   * The value on the y axis.
   */
  value: number
  /**
   * Raw id of the series the point belongs to. Undefined puts every point in one series
   * named after the metric.
   */
  group?: string
}

export interface ScatterChartData extends ResultMetaBase {
  points: ScatterDataPoint[]
  metric: string
  metricUnit?: string
  dimension?: string
  display?: Display
}

export const isScatterChartData = (data: unknown): data is ScatterChartData => {
  if (data === null || typeof data !== 'object') {
    return false
  }

  if (!('points' in data)) {
    return false
  }

  return Array.isArray(data.points)
}
