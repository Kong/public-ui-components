import type { Ref } from 'vue'
import type { ScriptableContext } from 'chart.js'
import type { Dataset, ExploreToDatasetDeps, KChartData, ResolvedReferenceLine, ScatterChartData, ScatterOptions, ScatterPointExtra } from '../types'
import type { ScatterChartColors } from '../utils'

import { computed } from 'vue'
import { isNullOrUndef } from 'chart.js/helpers'

import { computePercentiles, datavisPalette, determineBaseColor, scatterChartColors, withAlpha } from '../utils'
import composables from '../composables'

export const DEFAULT_POINT_RADIUS = 2
export const DEFAULT_POINT_OPACITY = 0.6
const OUTLIER_RADIUS_BOOST = 1
const HOVER_RADIUS_BOOST = 2
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
  extras?: ScatterPointExtra[]
}

export const jitter = (jitterMs: number): number => {
  if (!jitterMs) {
    return 0
  }

  return Math.random() * jitterMs
}

/**
 * Builds the dataset for scatter plots as one point per record, grouped into a series per dimension.
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

      const { metric, dimension, display } = data

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

        points.push({
          x: point.timestamp + jitter(jitterMs),
          y: point.value,
          ...(point.extras?.length ? { extras: point.extras } : {}),
        })
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
      const hasOutliers = outlierValue !== undefined && Number.isFinite(outlierValue)

      const colorPalette = isNullOrUndef(deps.colorPalette) ? datavisPalette : deps.colorPalette
      const themeColors = deps.themeColors?.value ?? scatterChartColors()
      const datasets: Dataset[] = []



      const isOutlier = (raw: unknown): boolean => {
        const y = (raw as ScatterPoint | undefined)?.y

        return hasOutliers && Number.isFinite(y) && (y as number) > (outlierValue as number)
      }

      Array.from(grouped.entries()).forEach(([groupId, points], i) => {
        const name = (dimension && display?.[groupId]?.name) || groupId
        const isSegmentEmpty = groupId === 'empty'
        const baseColor = determineBaseColor(i, name, isSegmentEmpty, colorPalette)
        // Translucent fill so overlapping points darken where the cloud is dense
        const fillColor = withAlpha(baseColor, pointOpacity)

        // @ts-ignore - dynamic i18n key
        const label: string = (i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name

        datasets.push({
          type: 'scatter',
          rawDimension: name,
          rawMetric: metric,
          label,
          // Outliers are recolored where they sit instead of being moved into a separate series
          borderColor: (ctx: ScriptableContext<'line'>) => isOutlier(ctx.raw) ? themeColors.outlier : baseColor,
          backgroundColor: (ctx: ScriptableContext<'line'>) => isOutlier(ctx.raw) ? themeColors.outlier : fillColor,
          pointRadius: (ctx: ScriptableContext<'line'>) => isOutlier(ctx.raw) ? pointRadius + OUTLIER_RADIUS_BOOST : pointRadius,
          pointHoverRadius: (ctx: ScriptableContext<'line'>) => (isOutlier(ctx.raw) ? pointRadius + OUTLIER_RADIUS_BOOST : pointRadius) + HOVER_RADIUS_BOOST,
          data: points,
          pointBorderWidth: 0,
          showLine: false,
          isSegmentEmpty,
        } as Dataset)
      })

      const referenceLines: ResolvedReferenceLine[] = []

      percentileLines.forEach(line => {
        const value = percentileValues.get(line.percentile)

        if (value === undefined || !Number.isFinite(value)) {
          return
        }

        const isMedian = line.percentile === MEDIAN_PERCENTILE

        referenceLines.push({
          percentile: line.percentile,
          label: labelFor(line.percentile, line.label),
          value,
          color: line.color || (isMedian ? themeColors.medianLine : themeColors.outlier),
          borderDash: line.borderDash || (isMedian ? MEDIAN_BORDER_DASH : OUTLIER_BORDER_DASH),
        })
      })

      return {
        datasets,
        ...(hasOutliers
          ? {
            outlier: {
              value: outlierValue as number,
              label: i18n.t('scatter.outlier', { label: labelFor(scatter.outlierPercentile as number) }),
              color: themeColors.outlier,
            },
          }
          : {}),
        ...(referenceLines.length ? { referenceLines } : {}),
      }
    } catch (err) {
      console.warn(err)

      return { datasets: [] }
    }
  })
}
