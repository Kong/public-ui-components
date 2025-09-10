import { computed, onUnmounted } from 'vue'
import type {
  TooltipPositionerFunction,
  ChartType,
  TooltipYAlignment,
  TooltipXAlignment,
} from 'chart.js'
import {
  Tooltip,
} from 'chart.js'
import { formatChartTicksByGranularity, horizontalTooltipPositioning, lineChartTooltipBehavior, verticalTooltipPositioning } from '../utils'
import { isNullOrUndef } from 'chart.js/helpers'
import type { ExternalTooltipContext, LineChartOptions } from '../types'
import { millisecondsToHours } from 'date-fns'

export default function useLineChartOptions(chartOptions: LineChartOptions) {

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
      callback: (value: number) => {
        const tickValue = new Date(value)
        return formatChartTicksByGranularity({
          tickValue,
          granularity: chartOptions.granularity.value,
          dayBoundaryCrossed: dayBoundaryCrossed.value,
        })
      },
    },
    title: {
      display: !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
      text: chartOptions.dimensionAxesTitle?.value,
      padding: { top: 2 }, // Line chart X-axis label seems farther off than Bar charts
      font: {
        weight: 'bold',
      },
    },
    border: {
      display: false,
    },
    stacked: chartOptions.stacked.value,
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
    border: {
      display: false,
    },
    stacked: chartOptions.stacked.value,
  }))

  const chartID = chartOptions.tooltipState.chartID
  const positionKey = `lineChartTooltipPosition-${chartID}`

  const tooltipOptions = {
    enabled: false,
    position: positionKey,
  }

  Tooltip.positioners[positionKey] = function(elements, position) {
    if (!elements.length || chartOptions.tooltipState.interactionMode === 'interactive') {
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


  const dayBoundaryCrossed = computed(() => {
    const timeRange = Number(chartOptions.timeRangeMs.value)
    const now = new Date()
    const start = new Date(now.getTime() - timeRange)
    return millisecondsToHours(timeRange) > 24 || start.getDate() !== now.getDate()
  })

  const options = computed(() => {
    return {
      hover: {
        mode: 'index',
        intersect: false,
      },
      elements: {
        point: {
          radius: chartOptions.pointsWithoutHover?.value ? 3 : 0,
          hitRadius: 4,
          hoverRadius: 4,
        },
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
          ...tooltipOptions,
          external: (context: ExternalTooltipContext) => {
            lineChartTooltipBehavior(chartOptions.tooltipState, context, chartOptions.granularity.value)
          },
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    }
  })

  onUnmounted(() => {
    if (Tooltip.positioners[positionKey]) {
      delete Tooltip.positioners[positionKey]
    }
  })

  return {
    options,
  }
}

declare module 'chart.js' {
  interface TooltipPositionerMap {
    [key: string]: TooltipPositionerFunction<ChartType>
  }
}
