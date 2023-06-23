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
    const widthRatio = tooltipWidth / chartRect.width
    const rightScalingFactor = 0.15
    const leftScalingFactor = 1.15
    const x = position.x < chartCenterX
      ? position.x + (tooltipWidth * rightScalingFactor)
      // Another arbitrary aspect we are dealing with is that the amount the tooltip moves to the right seems to be
      // relatively consistent as the tooltip grows, while the amount it moves to the left increases significantly as
      // the tooltip width increases. To get around this we need to also apply an addtional scaling factor that represents
      // the ratio of the tooltip width to the chart width, to prevent it from moving too far to the left as the tooltip grows.
      : position.x - (tooltipWidth * leftScalingFactor * (1 - widthRatio))

    // Same thing here but moving the tooltip up or down by an amount proportional to the tooltip height.
    const aboveScalingFactor = 0.15
    const belowScalingFactor = 0.5
    let y = position.y < chartCenterY
      ? position.y + (tooltipHeight * aboveScalingFactor)
      : position.y - (tooltipHeight * belowScalingFactor)

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
