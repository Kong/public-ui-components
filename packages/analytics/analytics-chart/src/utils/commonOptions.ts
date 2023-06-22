import prettyBytes from 'pretty-bytes'
import { ExternalTooltipContext, KChartData, TooltipState } from '../types'
import { DECIMAL_DISPLAY, numberFormatter } from '../utils'
import { isValid } from 'date-fns'
import { ScatterDataPoint } from 'chart.js'
import { ChartTypes } from '../enums'

export const tooltipBehavior = (tooltipData: TooltipState, context: ExternalTooltipContext) : void => {
  const { tooltip } = context
  if (tooltip.opacity === 0) {
    tooltipData.showTooltip = false

    return
  }

  if (tooltip.body) {
    const colors = tooltip.labelColors
    const valueAxis = context.chart.config?.options?.indexAxis === 'y' ? 'x' : 'y'

    const isBarChart = [ChartTypes.HORIZONTAL_BAR, ChartTypes.VERTICAL_BAR].includes(tooltipData.chartType)
    const isDoughnutChart = tooltipData.chartType === ChartTypes.DOUGHNUT

    tooltipData.tooltipContext = tooltip.dataPoints[0].parsed.x

    tooltipData.tooltipSeries = tooltip.dataPoints.map((p, i) => {
      const rawValue = isDoughnutChart ? p.parsed : p.parsed[valueAxis]

      let value
      if (tooltipData.units === 'bytes') {
        value = !isNaN(rawValue) ? prettyBytes(rawValue) : rawValue
      } else {
        value = `${rawValue % 1 === 0 ? numberFormatter.format(rawValue) : numberFormatter.format(Number(rawValue.toFixed(DECIMAL_DISPLAY)))} ${tooltipData.units}`
      }

      const tooltipLabel = isBarChart && p.dataset.label !== p.label
        ? `${p.dataset.label} - ${p.label}`
        : isDoughnutChart
          // @ts-ignore - doughnut chart contains a single dataset, with a `labels` (plural) array
          ? p.dataset.labels[p.dataIndex]
          : p.dataset.label

      return {
        backgroundColor: colors[i].backgroundColor,
        borderColor: colors[i].borderColor,
        label: tooltipLabel,
        value,
        rawValue,
      }
    }).sort((a, b) => b.rawValue - a.rawValue)

    tooltipData.left = `${tooltip.x}px`
    tooltipData.top = `${tooltip.y}px`

    tooltipData.showTooltip = true
  }
}

export const hasDatasets = (chartData: KChartData) =>
  chartData && chartData.datasets && chartData.datasets.length

export const hasDataInDatasets = (chartData: KChartData) =>
  hasDatasets(chartData) && chartData.datasets.some((ds) => ds.data.length)

export const hasTwoOrMoreDataPoints = (chartData: KChartData) =>
  hasDataInDatasets(chartData) &&
  chartData.datasets.some((ds) => ds.data.length > 1)

export const hasTimeseriesData = (chartData: KChartData) =>
  hasTwoOrMoreDataPoints(chartData) && chartData.datasets.some((ds) => ds.data[0] && isValid((ds.data[0] as ScatterDataPoint).x))

export const hasMillisecondTimestamps = (chartData: KChartData) =>
  hasTimeseriesData(chartData) &&
  chartData.datasets.some(
    (ds) => ds.data[0] && (ds.data[0] as ScatterDataPoint).x.toString().length >= 13,
  )
