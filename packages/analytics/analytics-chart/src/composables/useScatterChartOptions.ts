import type { ChartType, TooltipPositionerFunction, TooltipXAlignment, TooltipYAlignment } from 'chart.js'
import type { ExternalTooltipContext, ScatterChartOptions } from '../types'

import { computed, onUnmounted } from 'vue'
import { Tooltip } from 'chart.js'
import { isNullOrUndef } from 'chart.js/helpers'
import { millisecondsToHours } from 'date-fns'

import {
  formatChartTicksByGranularity,
  horizontalTooltipPositioning,
  lineChartTooltipBehavior,
  verticalTooltipPositioning,
} from '../utils'

export default function useScatterChartOptions(chartOptions: ScatterChartOptions) {
  const dayBoundaryCrossed = computed(() => {
    const timeRange = Number(chartOptions.timeRangeMs.value)
    const now = new Date()
    const start = new Date(now.getTime() - timeRange)

    return millisecondsToHours(timeRange) > 24 || start.getDate() !== now.getDate()
  })

  const xAxesOptions = computed(() => ({
    // `time`, **NOT** `timeseries`: a scatter plots raw records at irregular timestamps, and
    // the `timeseries` scale spaces data points evenly regardless of when they occurred
    type: 'time',
    display: true,
    grid: {
      display: true,
      drawOnChartArea: false,
      drawTicks: true,
      drawBorder: false,
    },
    ticks: {
      padding: 0,
      autoSkipPadding: 100,
      source: 'auto',
      maxRotation: 0,
      callback: (value: number) => formatChartTicksByGranularity({
        tickValue: new Date(value),
        granularity: chartOptions.granularity.value,
        dayBoundaryCrossed: dayBoundaryCrossed.value,
      }),
    },
    title: {
      display: !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
      text: chartOptions.dimensionAxesTitle?.value,
      padding: { top: 3 },
      font: {
        weight: 'bold',
      },
    },
    border: {
      display: false,
    },
  }))

  const yAxesOptions = computed(() => ({
    title: {
      display: !isNullOrUndef(chartOptions.metricAxesTitle?.value),
      text: chartOptions.metricAxesTitle?.value,
      padding: { bottom: 3 },
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
    border: {
      display: false,
    },
  }))

  const chartID = chartOptions.tooltipState.chartID
  const positionKey = `scatterChartTooltipPosition-${chartID}`

  Tooltip.positioners[positionKey] = function(elements, position) {
    if (!elements.length || chartOptions.tooltipState.interactionMode === 'interactive' || position.x === null || position.y === null) {
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

  const options = computed(() => ({
    // `intersect: false` is what makes hover usable. Data points with the pointRadius (default of 2)
    //  will give a wider target
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    animation: {
      duration: 250,
      easing: 'linear',
    },
    scales: {
      x: xAxesOptions.value,
      y: yAxesOptions.value,
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
        enabled: false,
        position: positionKey,
        external: (context: ExternalTooltipContext) => {
          lineChartTooltipBehavior(chartOptions.tooltipState, context, chartOptions.granularity.value)
        },
      },
      outlierBandPlugin: {
        value: chartOptions.outlierValue?.value,
        color: chartOptions.themeColors.value.outlierBand,
      },
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
  }))

  onUnmounted(() => {
    if (Tooltip.positioners[positionKey]) {
      delete Tooltip.positioners[positionKey]
    }
  })

  return { options }
}

declare module 'chart.js' {
  interface TooltipPositionerMap {
    [key: string]: TooltipPositionerFunction<ChartType>
  }
}
