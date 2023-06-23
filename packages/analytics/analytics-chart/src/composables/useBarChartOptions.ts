import { BarChartOptions, ExternalTooltipContext } from '../types'
import { Tooltip, TooltipPositionerFunction, ChartType, CategoryScale, TooltipItem, TooltipXAlignment } from 'chart.js'
import { isNullOrUndef } from 'chart.js/helpers'
import { MAX_LABEL_LENGTH, tooltipBehavior } from '../utils'
import { computed } from 'vue'

export default function useBarChartOptions(chartOptions: BarChartOptions) {

  const tooltipOptions = {
    enabled: false,
    position: 'barChartTooltipPosition',
    callbacks: {
      label: (context: TooltipItem<'bar'>) => {
        return {
          label: context.dataset.label,
          value: context.label,
        }
      },
    },
  }

  Tooltip.positioners.barChartTooltipPosition = function(elements, position) {
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
      indexAxis: chartOptions.indexAxis,
      scales: {
        x: {
          border: {
            display: false,
          },
          stacked: chartOptions.stacked,
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            maxRotation: 90,
            autoSkip: false,
            callback: function(value: string, index: number): string {
              const that = this as unknown as CategoryScale
              if (that.chart.options.indexAxis === that.axis) {
                value = that.getLabelForValue(index)
                const maxLabelLength = 10
                if (value && value.length > maxLabelLength) {
                  return value.slice(0, maxLabelLength) + '...'
                } else {
                  return value
                }
              }

              return that.getLabelForValue(Number(value))
            },
          },
          title: {
            display: chartOptions.indexAxis === 'y'
              ? !isNullOrUndef(chartOptions.metricAxesTitle?.value)
              : !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
            text: chartOptions.indexAxis === 'y'
              ? chartOptions.metricAxesTitle?.value
              : chartOptions.dimensionAxesTitle?.value,
            padding: { top: 20 },
            font: {
              weight: 'bold',
            },
          },
        },
        y: {
          border: {
            display: false,
          },
          stacked: chartOptions.stacked.value,
          beginAtZero: true,
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            callback: function(value: string, index: number): string {
              const that = this as unknown as CategoryScale

              if (that.chart.options.indexAxis === that.axis) {
                value = that.getLabelForValue(index)

                if (value && value.length > MAX_LABEL_LENGTH) {
                  return value.slice(0, MAX_LABEL_LENGTH) + '...'
                } else {
                  return value
                }
              }

              return that.getLabelForValue(Number(value))
            },
          },
          title: {
            display: chartOptions.indexAxis === 'x'
              ? !isNullOrUndef(chartOptions.metricAxesTitle?.value)
              : !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
            text: chartOptions.indexAxis === 'x'
              ? chartOptions.metricAxesTitle?.value
              : chartOptions.dimensionAxesTitle?.value,
            padding: { bottom: 20 },
            font: {
              weight: 'bold',
            },
          },
        },
      },
      plugins: {
        htmlLegend: {
          containerID: chartOptions.legendID,
        },
        legend: {
          display: false,
        },
        tooltip: {
          ...tooltipOptions,
          external: (context: ExternalTooltipContext) => {
            tooltipBehavior(chartOptions.tooltipState, context)
          },
        },
      },
      onHover: {
        mode: 'nearest',
        intersect: true,
      },
      maxBarThickness: 60,
      maintainAspectRatio: false,
    }
  })

  return options
}

declare module 'chart.js' {
  interface TooltipPositionerMap {
    barChartTooltipPosition: TooltipPositionerFunction<ChartType>;
  }
}
