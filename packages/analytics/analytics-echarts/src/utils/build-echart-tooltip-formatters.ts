import type { CallbackDataParams } from 'echarts/types/dist/shared'
import type { ChartTooltipSortFn, KChartData, TooltipEntry, TooltipState } from '../types'
import { formatTooltipTimestampByGranularity } from './format-timestamps'

type TooltipFormatterParams = CallbackDataParams & {
  axisValue?: string | number
  axisValueLabel?: string
}

const getColorString = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return getColorString(value[0])
  }

  if (value && typeof value === 'object' && 'color' in value) {
    return getColorString(value.color)
  }

  return ''
}

const getTooltipRawValue = (value: unknown): number => {
  if (Array.isArray(value)) {
    return Number(value[value.length - 1] ?? 0)
  }

  return Number(value ?? 0)
}

const normalizeTooltipPoints = (params: unknown): TooltipFormatterParams[] => {
  return (Array.isArray(params) ? params : [params]).filter(Boolean) as TooltipFormatterParams[]
}

const getCrossSectionTooltipSubtitle = ({
  chartData,
  points,
  dimensionAxisTitle,
}: {
  chartData: KChartData
  points: TooltipFormatterParams[]
  dimensionAxisTitle?: string
}) => {
  const firstPoint = points[0]

  if (!firstPoint) {
    return dimensionAxisTitle || ''
  }

  if (chartData.isMultiDimension) {
    return String(firstPoint.axisValueLabel || firstPoint.axisValue || '')
  }

  return String(firstPoint.seriesName || firstPoint.name || firstPoint.axisValueLabel || dimensionAxisTitle || '')
}

const buildTooltipEntries = ({
  points,
  formatValue,
}: {
  points: TooltipFormatterParams[]
  formatValue: (value: number) => string
}) => {
  return points.map((point) => {
    const rawValue = Number(Array.isArray(point.value) ? point.value[1] : point.value ?? 0)

    return {
      label: String(point.seriesName ?? ''),
      value: formatValue(rawValue),
      rawValue,
      backgroundColor: getColorString(point.color),
      borderColor: getColorString(point.borderColor || point.color),
    } satisfies TooltipEntry
  })
}

const buildCrossSectionTooltipEntries = ({
  points,
  formatValue,
}: {
  points: TooltipFormatterParams[]
  formatValue: (value: number) => string
}) => {
  return points.map((point) => {
    const rawValue = getTooltipRawValue(point.value)

    return {
      label: String(point.seriesName ?? ''),
      value: formatValue(rawValue),
      rawValue,
      backgroundColor: getColorString(point.color),
      borderColor: getColorString(point.color),
    } satisfies TooltipEntry
  })
}

const DEFAULT_TOOLTIP_SORT: ChartTooltipSortFn = (a, b) => b.rawValue - a.rawValue

export const createTimeseriesTooltipFormatter = ({
  granularity,
  tooltipState,
  tooltipTitle,
  tooltipMetricDisplay,
  formatValue,
  chartTooltipSortFn,
}: {
  granularity: string
  tooltipState: TooltipState
  tooltipTitle?: string
  tooltipMetricDisplay?: string
  formatValue: (value: number) => string
  chartTooltipSortFn?: ChartTooltipSortFn
}) => {
  return (params: unknown) => {
    const points = normalizeTooltipPoints(params)

    tooltipState.title = tooltipTitle
    tooltipState.metricDisplay = tooltipMetricDisplay
    tooltipState.entries = buildTooltipEntries({
      points,
      formatValue,
    }).sort(chartTooltipSortFn || DEFAULT_TOOLTIP_SORT)
    tooltipState.subtitle = points[0]?.axisValue
      ? formatTooltipTimestampByGranularity({
        tickValue: new Date(Number(points[0].axisValue)),
        granularity,
      })
      : undefined
    tooltipState.visible = true

    return ''
  }
}

export const createCrossSectionDonutTooltipFormatter = ({
  tooltipState,
  tooltipTitle,
  tooltipMetricDisplay,
  dimensionAxisTitle,
  formatValue,
}: {
  tooltipState: TooltipState
  tooltipTitle?: string
  tooltipMetricDisplay?: string
  dimensionAxisTitle?: string
  formatValue: (value: number) => string
}) => {
  return (params: unknown) => {
    const point = normalizeTooltipPoints(params)[0]
    const rawValue = Number(point.value || 0)

    tooltipState.title = tooltipTitle
    tooltipState.subtitle = dimensionAxisTitle || String(point.name || '')
    tooltipState.metricDisplay = tooltipMetricDisplay
    tooltipState.entries = [{
      label: String(point.name || ''),
      value: formatValue(rawValue),
      rawValue,
      backgroundColor: getColorString(point.color),
      borderColor: getColorString(point.color),
    }]
    tooltipState.visible = true

    return ''
  }
}

export const createCrossSectionBarTooltipFormatter = ({
  chartData,
  tooltipState,
  tooltipTitle,
  tooltipMetricDisplay,
  dimensionAxisTitle,
  formatValue,
  chartTooltipSortFn,
}: {
  chartData: KChartData
  tooltipState: TooltipState
  tooltipTitle?: string
  tooltipMetricDisplay?: string
  dimensionAxisTitle?: string
  formatValue: (value: number) => string
  chartTooltipSortFn?: ChartTooltipSortFn
}) => {
  return (params: unknown) => {
    const points = normalizeTooltipPoints(params)
    const validPoints = points.filter((point) => {
      const rawValue = getTooltipRawValue(point.value)

      return Number.isFinite(rawValue) && rawValue !== 0
    })

    tooltipState.title = tooltipTitle
    tooltipState.metricDisplay = tooltipMetricDisplay
    tooltipState.subtitle = getCrossSectionTooltipSubtitle({
      chartData,
      points,
      dimensionAxisTitle,
    })
    tooltipState.entries = buildCrossSectionTooltipEntries({
      points: validPoints,
      formatValue,
    }).sort(chartTooltipSortFn || DEFAULT_TOOLTIP_SORT)
    tooltipState.visible = true

    return ''
  }
}
