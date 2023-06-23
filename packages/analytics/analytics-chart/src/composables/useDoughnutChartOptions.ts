import { computed } from 'vue'
import { DoughnutChartOptions, ExternalTooltipContext } from '../types'
import {
  Tooltip,
  TooltipItem,
  TooltipXAlignment,
  TooltipPositionerFunction,
  ChartType,
} from 'chart.js'
import { tooltipBehavior } from '../utils'

export default function useDoughnutChartOptions(chartOptions: DoughnutChartOptions) {
  const tooltipOptions = {
    enabled: false,
    position: 'doughnutChartTooltipPosition',
    callbacks: {
      label: (context: TooltipItem<'doughnut'>) => {
        return {
          label: context.dataset.label,
          value: context.label,
        }
      },
    },
  }

  Tooltip.positioners.doughnutChartTooltipPosition = function(elements, position) {
    if (!elements.length) {
      return false
    }

    const chartRect = this.chart.canvas.getBoundingClientRect()

    const tooltipWidth = chartOptions.tooltipState.width || this.width

    const chartCenterX = chartRect.width / 2

    // Move tooltip right or left by an amount proportional to the tooltip width
    // based on the position of the cursor relative to the center of the chart.
    // Need to move the tooltip less to the right and more to the left, to take into account
    // the original position of the tooltip, which is scewed towards the top left of the tooltip.
    const widthRatio = tooltipWidth / chartRect.width
    const rightScalingFactor = 0.1
    const leftScalingFactor = 1.15
    const x = position.x < chartCenterX
      ? position.x + (tooltipWidth * rightScalingFactor)
      // Another arbitrary aspect we are dealing with is that the amount the tooltip moves to the right seems to be
      // relatively consistent as the tooltip grows, while the amount it moves to the left increases significantly as
      // the tooltip width increases. To get around this we need to also apply an addtional scaling factor that represents
      // the ratio of the tooltip width to the chart width, to prevent it from moving too far to the left as the tooltip grows.
      : position.x - (tooltipWidth * leftScalingFactor * (1 - widthRatio))
    const y = position.y

    const xAlign: TooltipXAlignment = position.x < chartCenterX ? 'left' : 'center'

    return {
      x: x - chartOptions.tooltipState.offset,
      y,
      xAlign,
    }
  }

  const options = computed(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        htmlLegend: {
          containerID: chartOptions.legendID,
        },
        legend: {
          // Hide chartjs legend
          display: false,
        },
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
    doughnutChartTooltipPosition: TooltipPositionerFunction<ChartType>;
  }
}
