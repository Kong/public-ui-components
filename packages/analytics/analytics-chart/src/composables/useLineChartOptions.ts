import { computed } from 'vue'
import type {
  TooltipPositionerFunction,
  ChartType,
  TooltipYAlignment,
  TooltipXAlignment,
} from 'chart.js'
import {
  Tooltip,
} from 'chart.js'
import { horizontalTooltipPositioning, tooltipBehavior, verticalTooltipPositioning } from '../utils'
import { isNullOrUndef } from 'chart.js/helpers'
import type { ExternalTooltipContext, LineChartOptions } from '../types'
import type { GranularityValues } from '@kong-ui-public/analytics-utilities'

export default function useLinechartOptions(chartOptions: LineChartOptions) {

  const xAxesOptions = computed(() => ({
    type: 'timeseries',
    display: true,
    grid: {
      display: true,
      drawOnChartArea: false,
      drawTicks: true,
      drawBorder: false,
    },
    ticks: {
      padding: 10,
      autoSkipPadding: 100,
      source: 'auto',
      maxRotation: 0,
    },
    title: {
      display: !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
      text: chartOptions.dimensionAxesTitle?.value,
      padding: { top: 2 }, // Line chart X-axis label seems farther off than Bar charts
      font: {
        weight: 'bold',
      },
    },
  }))
  const yAxesOptions = computed(() => ({
    title: {
      display: !isNullOrUndef(chartOptions.metricAxesTitle?.value),
      text: chartOptions.metricAxesTitle?.value,
      padding: { bottom: 10 },
      font: {
        weight: 'bold',
      },
    },
    ticks: {
      maxTicksLimit: 5,
    },
    grid: {
      drawBorder: false,
    },
    id: 'main-y-axis',
    beginAtZero: true,
  }))

  const tooltipOptions = {
    enabled: false,
    position: 'lineChartTooltipPosition',
  }

  Tooltip.positioners.lineChartTooltipPosition = function(elements, position) {
    // Happens when nothing is found
    if (!elements.length || chartOptions.tooltipState.locked) {
      return false
    }

    const chartRect = this.chart.canvas.getBoundingClientRect()

    const tooltipWidth = chartOptions.tooltipState.width || this.width
    const tooltipHeight = chartOptions.tooltipState.height || this.height

    const chartCenterX = chartRect.width / 2
    const chartCenterY = chartRect.height / 2

    const x = horizontalTooltipPositioning(position, tooltipWidth, chartCenterX)
    let y = verticalTooltipPositioning(position, tooltipHeight, chartCenterY)

    const yAlign: TooltipYAlignment = position.y < chartCenterY ? 'top' : 'bottom'
    const xAlign: TooltipXAlignment = position.x < chartCenterX ? 'left' : 'center'

    // Set a constant vertical position for the tooltip once it reaches the same height as the chart.
    if (tooltipHeight > chartRect.height) {
      y = 0
    }

    return {
      x,
      y,
      xAlign,
      yAlign,
    }
  }

  /**
   * ChartJS only supports the following "time units" so we must consolidate our granularities into these units.
   * 'millisecond'
   * 'second'
   * 'minute'
   * 'hour'
   * 'day'
   * 'week'
   * 'month'
   * 'quarter'
   * 'year'
   */
  const granularityToChartJSTimeUnitMap: Partial<Record<GranularityValues, string>> = {
    secondly: 'second',
    tenSecondly: 'second',
    thirtySecondly: 'second',
    minutely: 'minute',
    fiveMinutely: 'minute',
    tenMinutely: 'minute',
    thirtyMinutely: 'minute',
    hourly: 'hour',
    twoHourly: 'hour',
    twelveHourly: 'hour',
    daily: 'day',
    weekly: 'week',
  }

  const xAxisGranularityUnit = computed(() => {
    return chartOptions.granularity.value in granularityToChartJSTimeUnitMap
      ? granularityToChartJSTimeUnitMap[chartOptions.granularity.value] : 'hour'
  })

  const dayBoundaryCrossed = computed(() => {
    const now = new Date()
    const start = new Date(now.getTime() - Number(chartOptions.timeRangeMs.value))
    return start.getDate() !== now.getDate()
  })

  const options = computed(() => {
    return {
      hover: {
        mode: 'index',
        intersect: false,
      },
      elements: {
        point: {
          radius: 0,
          hitRadius: 4,
          hoverRadius: 4,
        },
      },
      animation: {
        duration: 250,
        easing: 'linear',
      },
      scales: {
        x: {
          border: {
            display: false,
          },
          ...xAxesOptions.value,
          stacked: chartOptions.stacked.value,
          time: {
            tooltipFormat: 'h:mm:ss a',
            unit: xAxisGranularityUnit.value,
            displayFormats: {
              second: dayBoundaryCrossed.value ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a',
              minute: dayBoundaryCrossed.value ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a',
              hour: dayBoundaryCrossed.value ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a',
              day: 'yyyy-MM-dd',
              week: 'yyyy-MM-dd',
              month: 'yyyy-MM-dd',
              quarter: 'yyyy-MM-dd',
              year: 'yyyy-MM-dd',
            },
          },
        },
        y: {
          border: {
            display: false,
          },
          ...yAxesOptions.value,
          stacked: chartOptions.stacked.value,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        htmlLegend: {
          containerID: chartOptions.legendID,
        },
        legend: {
          display: false,
        },
        streaming: false,
        tooltip: {
          ...tooltipOptions,
          external: (context: ExternalTooltipContext) => {
            tooltipBehavior(chartOptions.tooltipState, context)
          },
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    }
  })

  return {
    options,
  }
}

declare module 'chart.js' {
  interface TooltipPositionerMap {
    lineChartTooltipPosition: TooltipPositionerFunction<ChartType>;
  }
}
