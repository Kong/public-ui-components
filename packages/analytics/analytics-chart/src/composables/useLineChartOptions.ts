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
import { millisecondsToHours, secondsToHours } from 'date-fns'
import { isNullOrUndef } from 'chart.js/helpers'
import type { ExternalTooltipContext, LineChartOptions } from '../types'
import { GranularityKeys } from '@kong-ui-public/analytics-utilities'

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
      padding: { top: 20 },
      font: {
        weight: 'bold',
      },
    },
  }))
  const yAxesOptions = computed(() => ({
    title: {
      display: !isNullOrUndef(chartOptions.metricAxesTitle?.value),
      text: chartOptions.metricAxesTitle?.value,
      padding: { bottom: 20 },
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

  const xAxisGranularityUnit = computed(() => {
    switch (chartOptions.granularity.value) {
      case GranularityKeys.MINUTELY:
        return 'minute'
      case GranularityKeys.HOURLY:
        return 'hour'
      case GranularityKeys.DAILY:
        return 'day'
      default:
        return 'day'
    }
  })

  const hourDisplayFormat = computed(() => {
    return millisecondsToHours(Number(chartOptions.timeRangeMs.value)) >= 24 ? 'yyyy-MM-dd h:mm' : 'h:mm'
  })

  const dayDisplayFormat = computed(() => {
    return [GranularityKeys.DAILY, GranularityKeys.WEEKLY].includes(chartOptions.granularity.value as GranularityKeys) ? 'yyyy-MM-dd' : 'yyyy-MM-dd h:mm'
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
              minute: 'h:mm:ss a',
              hour: hourDisplayFormat.value,
              day: dayDisplayFormat.value,
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
