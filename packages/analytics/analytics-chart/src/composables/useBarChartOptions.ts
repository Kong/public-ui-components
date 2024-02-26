import type { BarChartOptions, ExternalTooltipContext } from '../types'
import { Tooltip, Interaction } from 'chart.js'
import type {
  TooltipPositionerFunction,
  ChartType,
  TooltipItem,
  TooltipXAlignment,
  InteractionModeFunction,
  InteractionItem,
  CategoryScale,
} from 'chart.js'
import { isNullOrUndef, getRelativePosition } from 'chart.js/helpers'
import { FONT_SIZE_SMALL, FONT_SIZE_REGULAR, MAX_LABEL_LENGTH, horizontalTooltipPositioning, tooltipBehavior } from '../utils'
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

    const x = horizontalTooltipPositioning(position, tooltipWidth, chartCenterX)
    const y = position.y

    const xAlign: TooltipXAlignment = position.x < chartCenterX ? 'left' : 'center'

    return {
      x: x - chartOptions.tooltipState.offsetX,
      y: y - chartOptions.tooltipState.offsetY,
      xAlign,
    }
  }

  /**
  * Custom interaction mode
  * @function Interaction.modes.customInteractionMode
  * @param {Chart} chart - the chart we are returning items from
  * @param {Event} e - the event we are find things at
  * @return {InteractionItem[]} - items that are found
  */
  Interaction.modes.customInteractionMode = function(chart, e) {
    // @ts-ignore - Chart.js bad typting
    const position = getRelativePosition(e, chart)
    const items: InteractionItem[] = []
    Interaction.evaluateInteractionItems(chart, chart.options.indexAxis || 'x', position, (element, datasetIndex, index) => {
      if (chart.options.indexAxis === 'y' && element.inYRange(position.y, true) && chart.data.datasets[datasetIndex].data[index]) {
        items.push({ element, datasetIndex, index })
      }
      if (chart.options.indexAxis === 'x' && element.inXRange(position.x, true) && chart.data.datasets[datasetIndex].data[index]) {
        items.push({ element, datasetIndex, index })
      }
    })
    return items
  }

  // For larger datasets, allow enough vertical space to display all axis labels
  const labelFontSize = chartOptions.numLabels.value > 25 ? FONT_SIZE_SMALL : FONT_SIZE_REGULAR

  const options = computed(() => {
    return {
      indexAxis: chartOptions.indexAxis,
      skipNull: true,
      scales: {
        x: {
          border: {
            display: false,
          },
          stacked: chartOptions.stacked.value,
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            maxRotation: 90,
            autoSkip: false,
            font: labelFontSize,
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
            padding: { top: 10 },
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
            font: labelFontSize,
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
      interaction: {
        mode: 'customInteractionMode',
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
  interface InteractionModeMap {
    customInteractionMode: InteractionModeFunction;
  }
}
