import type { Chart, ChartData, DefaultDataPoint } from 'chart.js'
import { toFont } from 'chart.js/helpers'
import composables from '../composables'
import { unitFormatter, numberFormatter } from '@kong-ui-public/analytics-utilities'

export type BarChartData = ChartData<'bar', DefaultDataPoint<'bar'>, string>

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
