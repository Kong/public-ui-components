import { computed, onUnmounted } from 'vue'
import type { DonutChartOptions, ExternalTooltipContext } from '../types'
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

export default function useDonutChartOptions(chartOptions: DonutChartOptions) {

  const chartID = chartOptions.tooltipState.chartID
  const positionKey = `donutChartTooltipPosition-${chartID}`

  const tooltipOptions = {
    enabled: false,
    position: positionKey,
    callbacks: {
      label: (context: TooltipItem<'doughnut'>) => {
        return {
          label: context.dataset.label,
          value: context.label,
        }
      },
    },
  }

  Tooltip.positioners[positionKey] = function(elements, position) {
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
      x: x - chartOptions.tooltipState.offsetX,
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
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 5,
          bottom: 0,
        },
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
