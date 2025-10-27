import type { ExternalTooltipContext, KChartData, TooltipState, TooltipEntry, Dataset, ChartLegendSortFn, LegendValues, EnhancedLegendItem, TooltipInteractionMode } from '../types'
import { formatTooltipTimestampByGranularity } from '../utils'
import { isValid } from 'date-fns'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { Chart, Point, ScatterDataPoint } from 'chart.js'
import type { GranularityValues } from '@kong-ui-public/analytics-utilities'

export const isTooltipInteractive = (state: TooltipInteractionMode) => {
  return ['interactive', 'zoom-interactive'].includes(state)
}

export const lineChartTooltipBehavior = (
  tooltipData: TooltipState,
  context: ExternalTooltipContext,
  granularity: GranularityValues,
  options?: {
    contextFormatter?: (x: number, granularity: GranularityValues) => string | number
  },
) : void => {
  const { tooltip } = context
  if (tooltip.opacity === 0 && !isTooltipInteractive(tooltipData.interactionMode)) {
    tooltipData.showTooltip = false

    return
  }
  const { i18n } = composables.useI18n()
  const { formatUnit } = unitFormatter({ i18n })
  const sortFn = tooltipData.chartTooltipSortFn || ((a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue)

  if (tooltip.body && !isTooltipInteractive(tooltipData.interactionMode)) {
    const colors = tooltip.labelColors
    const valueAxis = context.chart.config?.options?.indexAxis === 'y' ? 'x' : 'y'

    tooltipData.tooltipContext = options?.contextFormatter
      ? options.contextFormatter(tooltip.dataPoints[0].parsed.x, granularity)
      : formatTooltipTimestampByGranularity({
        tickValue: new Date(tooltip.dataPoints[0].parsed.x),
        granularity,
      })

    tooltipData.tooltipSeries = tooltip.dataPoints.map((p, i) => {
      const rawValue = p.parsed[valueAxis]
      const value = formatUnit(rawValue, tooltipData.units, { translateUnit: tooltipData.translateUnit })

      const tooltipLabel = p.dataset.label

      return {
        backgroundColor: colors[i].backgroundColor,
        borderColor: colors[i].borderColor,
        label: tooltipLabel,
        value,
        rawValue,
        isSegmentEmpty: (p.dataset as Dataset).isSegmentEmpty,
      } as TooltipEntry
    }).sort(sortFn)

    tooltipData.left = `${tooltip.x}px`
    tooltipData.top = `${tooltip.y}px`

    tooltipData.showTooltip = true
  }
}

export const tooltipBehavior = (tooltipData: TooltipState, context: ExternalTooltipContext) : void => {
  const { tooltip } = context
  const { i18n } = composables.useI18n()
  const { formatUnit } = unitFormatter({ i18n })
  if (tooltip.opacity === 0 && !isTooltipInteractive(tooltipData.interactionMode)) {
    tooltipData.showTooltip = false

    return
  }

  const sortFn = tooltipData.chartTooltipSortFn || ((a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue)

  if (tooltip.body && !isTooltipInteractive(tooltipData.interactionMode)) {
    const colors = tooltip.labelColors
    const valueAxis = context.chart.config?.options?.indexAxis === 'y' ? 'x' : 'y'
    const isDonutChart = ['gauge', 'donut'].includes(tooltipData.chartType)

    if (isDonutChart) {
      tooltipData.tooltipContext = tooltipData.dimensionDisplay || tooltip.dataPoints[0].label
    } else if ((tooltip.chart.data as KChartData).isMultiDimension) {
      tooltipData.tooltipContext = tooltip.dataPoints[0].label
    } else {
      tooltipData.tooltipContext = tooltipData.dimensionDisplay || ''
    }

    tooltipData.tooltipSeries = tooltip.dataPoints.map((p, i) => {
      const rawValue = isDonutChart ? p.parsed : p.parsed[valueAxis]
      const value = formatUnit(rawValue, tooltipData.units, { translateUnit: tooltipData.translateUnit })

      let tooltipLabel
      if (isDonutChart) {
        // @ts-ignore - donut chart contains a single dataset, with a `labels` (plural) array
        tooltipLabel = p.dataset.labels[p.dataIndex]
      } else {
        tooltipLabel = p.dataset.label
      }

      return {
        backgroundColor: colors[i].backgroundColor,
        borderColor: colors[i].borderColor,
        label: tooltipLabel,
        value,
        rawValue,
        isSegmentEmpty: (p.dataset as Dataset).isSegmentEmpty,
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

export const hasTimeseriesData = (chartData: KChartData) => {
  return chartData.datasets.some((ds) => ds.data[0] && isValid((ds.data[0] as ScatterDataPoint).x))
}

export const hasExactlyOneDatapoint = (chartData: KChartData) =>
  !!hasDataInDatasets(chartData) &&
  chartData.datasets.some((ds) => ds.data.length == 1)

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

export function debounce(fn: (...args: any) => any, delay: number) {
  let timeoutId: number
  return (...args: any) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const generateLegendItems = (chart: Chart, legendValues?: LegendValues, chartLegendSortFn?: ChartLegendSortFn): EnhancedLegendItem[] => {
  const data = chart.data as KChartData

  // @ts-ignore: ChartJS has incomplete types
  return (chart.options.plugins.legend.labels.generateLabels(chart))
    .filter(e => !legendValues?.[e.text]?.isThreshold)
    .map(((e, i) => ({
      ...e,
      value: legendValues && legendValues[e.text],
      isSegmentEmpty: data.datasets[i].isSegmentEmpty,
    } as EnhancedLegendItem)))
    .sort(chartLegendSortFn)
}
