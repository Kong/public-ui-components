import type { Ref } from 'vue'
import type { Dataset, ExploreToDatasetDeps, KChartData, ScatterChartData, ScatterOptions } from '../types'
import type { ScatterChartColors } from '../utils'

import { computed } from 'vue'
import { isNullOrUndef } from 'chart.js/helpers'

import { computePercentiles, datavisPalette, determineBaseColor, scatterChartColors, withAlpha } from '../utils'
import composables from '../composables'

export const DEFAULT_POINT_RADIUS = 2
export const DEFAULT_POINT_OPACITY = 0.6
const PERCENTILE_LINE_WIDTH = 1.5
const MEDIAN_PERCENTILE = 50
const MEDIAN_BORDER_DASH = [6, 4]
const OUTLIER_BORDER_DASH = [2, 3]

export interface ScatterDatasetDeps extends ExploreToDatasetDeps {
  scatter?: ScatterOptions
  themeColors?: Ref<ScatterChartColors>
}

interface ScatterPoint {
  x: number
  y: number
  // This should only be set for outliers as they all behave as one dataset, without
  // it each point in that dataset will just appear as `Outlier > 95`
  tooltipLabel?: string
}

export const jitter = (jitterMs: number): number => {
  if (!jitterMs) {
    return 0
  }

  return Math.random() * jitterMs
}

/**
 * Builds the dataset for scatter plots as one point per record, grouped into a series per dimension
 * with optional percentile reference lines and outliers
 *
 * Percentiles are computed over the points actually supplied, so they are only really
 * meaningful when the input is not truncated.
 */
export default function useScatterDatasets(
  deps: ScatterDatasetDeps,
  scatterData: Ref<ScatterChartData | undefined>,
): Ref<KChartData> {
  const { i18n } = composables.useI18n()

  const labelFor = (percentile: number, custom?: string): string => {
    if (custom) {
      return custom
    }

    if (percentile === MEDIAN_PERCENTILE) {
      return i18n.t('scatter.median')
    }

    return i18n.t('scatter.percentile', { value: percentile })
  }

  return computed<KChartData>(() => {
    try {
      const data = scatterData.value

      if (!data?.points?.length) {
        return { datasets: [] }
      }

      const { metric, dimension, display, start, end } = data

      const scatter = deps.scatter || {}
      const jitterMs = scatter.jitterMs ?? 0
      const pointRadius = scatter.pointRadius ?? DEFAULT_POINT_RADIUS
      const pointOpacity = scatter.pointOpacity ?? DEFAULT_POINT_OPACITY

      // Points without a group all share one series named after the metric.
      const grouped = new Map<string, ScatterPoint[]>()
      const allValues: number[] = []

      data.points.forEach((point) => {
        const groupId = point.group ?? metric
        const points = grouped.get(groupId) || []

        points.push({ x: point.timestamp + jitter(jitterMs), y: point.value })
        grouped.set(groupId, points)
        allValues.push(point.value)
      })

      const percentileLines = scatter.percentileLines || []
      const requestedPercentiles = [
        ...percentileLines.map(line => line.percentile),
        ...(scatter.outlierPercentile !== undefined ? [scatter.outlierPercentile] : []),
      ]
      const percentileValues = requestedPercentiles.length ? computePercentiles(allValues, requestedPercentiles) : new Map<number, number>()

      const outlierValue = scatter.outlierPercentile !== undefined ? percentileValues.get(scatter.outlierPercentile) : undefined
      const splitOutliers = outlierValue !== undefined && Number.isFinite(outlierValue)

      const outlierThresholdLabel = splitOutliers ? labelFor(scatter.outlierPercentile as number) : ''

      const colorPalette = isNullOrUndef(deps.colorPalette) ? datavisPalette : deps.colorPalette
      const themeColors = deps.themeColors?.value ?? scatterChartColors()
      const datasets: Dataset[] = []
      // Outliers from every series collect into one dataset so that the legend gains a
      // single toggleable "Outlier" entry rather than one per series. We may want
      // to rethink how this works, but good enough for now...
      const outliers: ScatterPoint[] = []

      /**
       * Splits the points of a series, returning the ones that aren't outliers and moving the rest into the
       * shared `outliers` dataset above
       */
      const withoutOutliers = (points: ScatterPoint[], seriesLabel: string): ScatterPoint[] => {
        if (!splitOutliers) {
          return points
        }

        const kept: ScatterPoint[] = []

        for (const point of points) {
          if (point.y <= (outlierValue as number)) {
            kept.push(point)
            continue
          }

          outliers.push({
            ...point,
            tooltipLabel: i18n.t('scatter.outlierTooltip', { series: seriesLabel, label: outlierThresholdLabel }),
          })
        }

        return kept
      }

      Array.from(grouped.entries()).forEach(([groupId, points], i) => {
        const name = (dimension && display?.[groupId]?.name) || groupId
        const isSegmentEmpty = groupId === 'empty'
        const baseColor = determineBaseColor(i, name, isSegmentEmpty, colorPalette)

        // @ts-ignore - dynamic i18n key
        const label: string = (i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name
        const kept = withoutOutliers(points, label)

        datasets.push({
          type: 'scatter',
          rawDimension: name,
          rawMetric: metric,
          label,
          // Translucent fill so overlapping points darken where the cloud is dense
          borderColor: baseColor,
          backgroundColor: withAlpha(baseColor, pointOpacity),
          data: kept,
          pointRadius,
          pointHoverRadius: pointRadius + 2,
          pointBorderWidth: 0,
          showLine: false,
          isSegmentEmpty,
        } as Dataset)
      })

      if (splitOutliers && outliers.length) {
        const outlierColor = themeColors.outlier

        datasets.push({
          type: 'scatter',
          rawDimension: 'outlier',
          rawMetric: metric,
          label: i18n.t('scatter.outlier', { label: outlierThresholdLabel }),
          borderColor: outlierColor,
          backgroundColor: outlierColor,
          data: outliers,
          pointRadius,
          pointHoverRadius: pointRadius + 2,
          pointBorderWidth: 0,
          showLine: false,
        } as Dataset)
      }

      // Reference lines are just two points which gives them legend entries. We may also
      // want to revisit this.
      const pointXValues = Array.from(grouped.values()).flat().map(point => point.x)
      const startMs = new Date(start).valueOf()
      const endMs = new Date(end).valueOf()
      const xMin = Number.isFinite(startMs) ? startMs : Math.min(...pointXValues)
      const xMax = Number.isFinite(endMs) ? endMs : Math.max(...pointXValues)

      percentileLines.forEach(line => {
        const value = percentileValues.get(line.percentile)

        if (value === undefined || !Number.isFinite(value)) {
          return
        }

        const isMedian = line.percentile === MEDIAN_PERCENTILE
        const color = line.color || (isMedian ? themeColors.medianLine : themeColors.outlier)

        datasets.push({
          type: 'line',
          rawDimension: `percentile-${line.percentile}`,
          rawMetric: metric,
          label: labelFor(line.percentile, line.label),
          data: [{ x: xMin, y: value }, { x: xMax, y: value }],
          borderColor: color,
          backgroundColor: color,
          borderDash: line.borderDash || (isMedian ? MEDIAN_BORDER_DASH : OUTLIER_BORDER_DASH),
          borderWidth: PERCENTILE_LINE_WIDTH,
          pointRadius: 0,
          pointHitRadius: 0,
          fill: false,
          total: value,
        } as Dataset)
      })

      return {
        datasets,
        ...(splitOutliers ? { outlierValue: outlierValue as number } : {}),
      }
    } catch (err) {
      console.warn(err)

      return { datasets: [] }
    }
  })
}
