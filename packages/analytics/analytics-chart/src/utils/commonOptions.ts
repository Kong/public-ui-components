import prettyBytes from 'pretty-bytes'
import type { ExternalTooltipContext, KChartData, TooltipState } from '../types'
import { DECIMAL_DISPLAY, numberFormatter } from '../utils'
import { isValid } from 'date-fns'
import type { Point, ScatterDataPoint } from 'chart.js'
import { ChartTypes, ChartTypesSimple } from '../enums'

export const tooltipBehavior = (tooltipData: TooltipState, context: ExternalTooltipContext) : void => {
  const { tooltip } = context
  if (tooltip.opacity === 0 && !tooltipData.locked) {
    tooltipData.showTooltip = false

    return
  }

  if (tooltip.body && !tooltipData.locked) {
    const colors = tooltip.labelColors
    const valueAxis = context.chart.config?.options?.indexAxis === 'y' ? 'x' : 'y'

    const isBarChart = [ChartTypes.HORIZONTAL_BAR, ChartTypes.VERTICAL_BAR].includes(tooltipData.chartType)
    const isDoughnutChart = [ChartTypesSimple.GAUGE, ChartTypes.DOUGHNUT].includes(tooltipData.chartType)
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

export const horizontalTooltipPositioning = (position: Point, tooltipWidth: number, chartCenterX: number) => {
  // We are manipulating an initial positioning logic that appears to be quite arbitrary.
  // ChartJS offers limited documentation on this. The logic that follows has been tested across multiple scenarios
  // and provides the most consistent visual output.
  // The goal is to shift the tooltip to either the left or right in proportion to the tooltip's width,
  // depending on the cursor's location relative to the chart's center.
  // Additionally, we need to scale by the ratio of the tooltip width to chart width in order to
  // adjust for any changes in the tooltip width.
  // The original tooltip position tends to lean towards the center of the tooltip — this is one of the arbitrary aspects we are dealing with.
  // It appears that the default position.x and position.y values don't consistently align with the tooltip.
  // It's likely that these initial position.x and position.y values refer to the position of ChartJS' default tooltip,
  // which is not visible as we're using a custom tooltip.
  const withRatioScalingBase = 1150 // Found through trial and error.
  const widthRatio = Math.min(tooltipWidth / withRatioScalingBase, 1) // Limit the ratio to a maximum of 1
  // Define a scaling factor for when the tooltip is positioned to the right of the cursor.
  // This factor will determine how much to the right the tooltip will be moved.
  const rightScalingFactor = 0.15
  // Define a scaling factor for when the tooltip is positioned to the left of the cursor.
  // This factor will determine how much to the left the tooltip will be moved.
  const leftScalingFactor = 1.15
  // Determine the x-coordinate for the tooltip based on the cursor's position relative to the chart's center.
  // If the cursor is to the left of the center, the tooltip will be positioned to the right of the cursor.
  // If the cursor is to the right of the center, the tooltip will be positioned to the left of the cursor.
  const x = position.x < chartCenterX
    // The tooltip is positioned to the right of the cursor:
    // Calculate the new x-coordinate by adding a value to the cursor's x-coordinate.
    // The added value is calculated by multiplying the tooltip's width by the right scaling factor.
    // This value is then adjusted by the tooltip width ratio to ensure that as the tooltip gets wider, it's moved to the right by a proportionally smaller amount.
    ? position.x + (tooltipWidth * rightScalingFactor * (1 - widthRatio))
    // The tooltip is positioned to the left of the cursor:
    // Calculate the new x-coordinate by subtracting a value from the cursor's x-coordinate.
    // The subtracted value is calculated by multiplying the tooltip's width by the left scaling factor.
    // This value is then adjusted by the tooltip width ratio to ensure that as the tooltip gets wider, it's moved to the left by a proportionally smaller amount.
    : position.x - (tooltipWidth * leftScalingFactor * (1 - widthRatio))

  return x
}

export const verticalTooltipPositioning = (position: Point, tooltipHeight: number, chartCenterY: number) => {
  // Same thing here but moving the tooltip up or down by an amount proportional to the tooltip height.
  const aboveScalingFactor = 0.15
  const belowScalingFactor = 0.5
  const y = position.y < chartCenterY
    ? position.y + (tooltipHeight * aboveScalingFactor)
    : position.y - (tooltipHeight * belowScalingFactor)

  return y
}
