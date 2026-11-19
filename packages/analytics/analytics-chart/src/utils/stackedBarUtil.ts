import type { Chart, ChartData, DefaultDataPoint } from 'chart.js'
import type { Dataset, KChartData } from '../types'
import { toFont } from 'chart.js/helpers'
import composables from '../composables'
import { unitFormatter, numberFormatter } from '@kong-ui-public/analytics-utilities'

export type BarChartData = ChartData<'bar', DefaultDataPoint<'bar'>, string>

type BarPoint = { x: number, y: number }

const labelHeightCache = new Map()

export const formatNumber = (value: number, unit: string) => {
  const { i18n } = composables.useI18n()
  const { formatBytes } = unitFormatter({ i18n })
  // TODO use `formatUnit` for all number formatting
  if (unit === 'bytes') {
    return formatBytes(value)
  } else if (unit === 'count/minute') {
    return value.toFixed(2)
  } else {
    return numberFormatter.format(value)
  }
}

export const getTextWidth = (text: string) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  // Measure the size of the label.
  // Source: https://github.com/chartjs/chartjs-plugin-annotation/blob/71c751f997174f7fe8b618aea9e081028b9bbfe5/src/helpers/helpers.canvas.js#L71
  // Sadly, chartjs-plugin-annotation doesn't export its helper functions.
  const font = toFont({})

  ctx.font = font.string

  return ctx.measureText(text).width
}

export const getTextHeight = (): number => {
  // All labels will be the same height, only one key needed
  const mapKey = 'label_height'

  if (!labelHeightCache.has(mapKey)) {
    const font = toFont({})

    labelHeightCache.set(mapKey, font.lineHeight)
  }

  return labelHeightCache.get(mapKey)

}

export const dataTotal = (data: BarChartData) =>
  data.datasets.reduce((acc: number, ds) =>
    acc + (ds.data as number[]).reduce((d: number, acc: number) => isNaN(acc) ? d : d + acc, 0), 0,
  )

export const conditionalDataTotal = (chart: Chart, data: BarChartData) =>
  data.datasets.reduce((acc, ds, idx) => {
    if (chart.isDatasetVisible(idx)) {
      return acc + (ds.data as number[]).reduce((d, acc) => isNaN(acc) ? d : d + acc, 0)
    } else {
      return acc
    }
  }, 0)

export const drawPercentage = (value: number, total: number) => {
  if (total === 0) {
    return ' (0.0%)'
  }

  const percentage = (value / total * 100).toFixed(1)

  return ` (${percentage}%)`
}

/**
 * Dense bar data has one slot per label in every dataset, with group-by, one dataset per entity
 * leaves almost every slot `null`, and Chart.js does work per slot per dataset, which **really**
 * adds up depending on how many entities are being displayed.
 *
 * This keeps only the bars that exist (i.e. not `null` or `0`). Points reference labels by index, which keeps entities with
 * duplicate display names on separate rows.
 */
export const toSparseBarData = (data: KChartData, indexAxis: 'x' | 'y'): KChartData => {
  const valueAxis = indexAxis === 'y' ? 'x' : 'y'

  const toPoints = (values: readonly unknown[]): BarPoint[] =>
    values.flatMap((value, labelIndex) => {
      // Nulls and zeros draw nothing, and the bar hover mode already skips falsy values
      if (typeof value !== 'number' || !value) {
        return []
      }

      return [{ [indexAxis]: labelIndex, [valueAxis]: value } as BarPoint]
    })

  return {
    ...data,
    datasets: data.datasets.map(dataset => ({ ...dataset, data: toPoints(dataset.data) }) as Dataset),
  }
}
