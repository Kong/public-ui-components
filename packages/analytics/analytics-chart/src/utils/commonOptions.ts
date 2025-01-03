import prettyBytes from 'pretty-bytes'
import type { ExternalTooltipContext, KChartData, TooltipState, TooltipEntry } from '../types'
import { DECIMAL_DISPLAY, numberFormatter } from '../utils'
import { isValid } from 'date-fns'
import type { Point, ScatterDataPoint } from 'chart.js'

// TODO: we should implement a separate tooltip behavior for each broad chart type
// as the "tooltip behaviors" are beggining to diverge more across chart types.
export const tooltipBehavior = (tooltipData: TooltipState, context: ExternalTooltipContext) : void => {
  const { tooltip } = context
  if (tooltip.opacity === 0 && !tooltipData.locked) {
    tooltipData.showTooltip = false

    return
  }

  const sortFn = tooltipData.chartTooltipSortFn || ((a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue)

  if (tooltip.body && !tooltipData.locked) {
    const colors = tooltip.labelColors
    const valueAxis = context.chart.config?.options?.indexAxis === 'y' ? 'x' : 'y'

    const isBarChart = ['horizontal_bar', 'vertical_bar'].includes(tooltipData.chartType)
    const isDoughnutChart = ['gauge', 'doughnut'].includes(tooltipData.chartType)

    tooltipData.tooltipContext = isBarChart
      ? tooltip.dataPoints.length > 1 ? tooltip.dataPoints[0].label : ''
      : tooltip.dataPoints[0].parsed.x

    tooltipData.tooltipSeries = tooltip.dataPoints.map((p, i) => {
      const rawValue = isDoughnutChart ? p.parsed : p.parsed[valueAxis]

      let value
      if (tooltipData.units === 'bytes') {
        value = !isNaN(rawValue) ? prettyBytes(rawValue) : rawValue
      } else {
        const translatedUnits = tooltipData.translateUnit(tooltipData.units, rawValue)
        const prefix = tooltipData.units === 'usd' ? '$' : ''
        value = `${prefix}${rawValue % 1 === 0 ? numberFormatter.format(rawValue) : numberFormatter.format(Number(rawValue.toFixed(DECIMAL_DISPLAY)))} ${translatedUnits}`
      }

      const tooltipLabel = isBarChart && p.dataset.label !== p.label
        ? p.dataset.label
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
      } as TooltipEntry
    }).sort(sortFn)

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

/**
  * Adjust the tooltip's horizontal position based on its width and cursor location relative to the chart center.
  * This logic ensures consistent visual placement of a custom tooltip, as ChartJS offers limited direct control.
  */
export const horizontalTooltipPositioning = (position: Point, tooltipWidth: number, chartCenterX: number) => {
  // Scaling factor that prevents the tooltip from shifting too far when it's wide, or too little when
  // it's narrow. Ensuring that as the tooltip width changes, the horizontal offset is proportionally
  // adjusted to maintain a visually balanced placement.
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

// eslint-disable-next-line @typescript-eslint/ban-types
export function debounce(fn: Function, delay: number) {
  let timeoutId: number
  return (...args: any) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
