import { computed } from 'vue'
import { Tooltip, TooltipPositionerFunction, ChartType, TooltipYAlignment, TooltipXAlignment } from 'chart.js'
import { tooltipBehavior } from '../utils'
import { secondsToHours } from 'date-fns'
import { isNullOrUndef } from 'chart.js/helpers'
import { ExternalTooltipContext, LineChartOptions } from '../types'
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
    mode: 'index',
    intersect: false,
    position: 'lineChartTooltipPosition',
  }

  Tooltip.positioners.lineChartTooltipPosition = function(elements, position) {
    // Happens when nothing is found
    if (!elements.length) {
      return false
    }

    const chartRect = this.chart.canvas.getBoundingClientRect()

    const tooltipWidth = chartOptions.tooltipState.width || this.width
    const tooltipHeight = chartOptions.tooltipState.height || this.height

    const chartCenterX = chartRect.width / 2
    const chartCenterY = chartRect.height / 2

    // Move the tooltip to the right or left by an amount proportional to the tooltip width
    // based on the position of the cursor relative to the center of the chart.
    // Need to move the tooltip less to the right and more to the left, to take into account
    // the original position of the tooltip, which is scewed towards the top left of the tooltip.
    // This is done to take into acount for changes in the tooltip width based on the
    // content inside of the tooltip.
    // If we move the tooltip to the right or left by a static amunt, the tooltip will either move
    // "to little" or "to mucch" depending on the width of the tooltip.
    const rightScalingFactor = 0.15
    const leftScalingFactor = 0.8
    const x = position.x < chartCenterX
      ? position.x + (tooltipWidth * rightScalingFactor)
      : position.x - (tooltipWidth * leftScalingFactor)

    // Same thing here but moving the tooltip up or down by an amount proportional to the tooltip height.
    const aboveScalingFactor = 0.15
    const belowScalingFactor = 0.5
    let y = position.y < chartCenterY
      ? position.y + (tooltipHeight * aboveScalingFactor)
      : position.y - (tooltipHeight * belowScalingFactor)

    const xAlign: TooltipXAlignment = position.x < chartCenterX ? 'left' : 'right'
    let yAlign: TooltipYAlignment = position.y < chartCenterY ? 'top' : 'bottom'

    // Adjust vertical position if tooltip height exceeds chart height
    if (tooltipHeight > chartRect.height) {
      y = 0
      yAlign = 'center'
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
    return secondsToHours(chartOptions.timeRange.value) >= 24 ? 'yyyy-MM-dd h:mm' : 'h:mm'
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
