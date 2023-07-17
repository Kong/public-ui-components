import { computed } from 'vue'
import { DoughnutChartOptions, ExternalTooltipContext } from '../types'
import {
  Tooltip,
  TooltipItem,
  TooltipXAlignment,
  TooltipPositionerFunction,
  ChartType,
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
      // If showing a simple total, allow for more space in the center
      cutout: chartOptions.isSimple.value ? '78%' : '50%',
      circumference: chartOptions.isSimple.value ? '200' : '360',
      rotation: chartOptions.isSimple.value ? '260' : '0',
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
