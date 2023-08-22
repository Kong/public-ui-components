import { computed } from 'vue'
import type { DoughnutChartOptions, ExternalTooltipContext } from '../types'
import type {
  TooltipItem,
  TooltipXAlignment,
  TooltipPositionerFunction,
  ChartType,
} from 'chart.js'
import {
  Tooltip,
} from 'chart.js'
import { horizontalTooltipPositioning, tooltipBehavior } from '../utils'

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

    const x = horizontalTooltipPositioning(position, tooltipWidth, chartCenterX)
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
