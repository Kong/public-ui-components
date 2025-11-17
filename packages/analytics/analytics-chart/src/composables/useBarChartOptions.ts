import type { BarChartOptions, ExternalTooltipContext, KChartData } from '../types'
import { Tooltip, Interaction } from 'chart.js'
import type {
  TooltipPositionerFunction,
  ChartType,
  TooltipItem,
  TooltipXAlignment,
  InteractionModeFunction,
  InteractionItem,
  CategoryScale,
  Chart,
} from 'chart.js'
import { isNullOrUndef, getRelativePosition } from 'chart.js/helpers'
import { FONT_SIZE_SMALL, FONT_SIZE_REGULAR, MAX_LABEL_LENGTH, horizontalTooltipPositioning, tooltipBehavior } from '../utils'
import { computed, onUnmounted, getCurrentInstance } from 'vue'

export default function useBarChartOptions(chartOptions: BarChartOptions) {

  const chartID = chartOptions.tooltipState.chartID
  const positionKey = `barChartTooltipPosition-${chartID}`

  const tooltipOptions = {
    enabled: false,
    position: positionKey,
    callbacks: {
      label: (context: TooltipItem<'bar'>) => {
        return {
          label: context.dataset.label,
          value: context.label,
        }
      },
    },
  }

  Tooltip.positioners[positionKey] = function(elements, position) {
    if (!elements.length || chartOptions.tooltipState.interactionMode === 'interactive') {
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

  const genTickFont = ({ chart, index }: { chart: Chart, index: number }) => {
    const data = chart.data as KChartData | undefined
    return {
      size: labelFontSize,
      style: data?.isLabelEmpty?.[index] ? 'italic' : 'normal',
    }
  }

  const genTickLabel = (scale: CategoryScale, value: string, index: number) => {
    if (scale.chart.options.indexAxis === scale.axis) {
      value = scale.getLabelForValue(index)

      if (value && value.length > MAX_LABEL_LENGTH) {
        return value.slice(0, MAX_LABEL_LENGTH) + '...'
      } else {
        return value
      }
    }

    return scale.getLabelForValue(Number(value))
  }

  const options = computed(() => {
    return {
      indexAxis: chartOptions.indexAxis,
      skipNull: true,
      scales: {
        x: {
          stacked: chartOptions.stacked.value,
          grid: {
            offset: false,
            drawOnChartArea: false,
            drawBorder: false,
            drawTicks: true,
          },
          ticks: {
            maxRotation: 90,
            autoSkip: false,
            font: genTickFont,
            callback: function(value: string, index: number): string {
              const that = this as unknown as CategoryScale
              return genTickLabel(that, value, index)
            },
          },
          title: {
            display: chartOptions.indexAxis === 'y'
              ? !isNullOrUndef(chartOptions.metricAxesTitle?.value)
              : !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
            text: chartOptions.indexAxis === 'y'
              ? chartOptions.metricAxesTitle?.value
              : chartOptions.dimensionAxesTitle?.value,
            padding: { top: 3, bottom: 0, left: 0, right: 0 },
            font: {
              weight: 'bold',
            },
          },
        },
        y: {
          stacked: chartOptions.stacked.value,
          beginAtZero: true,
          grid: {
            offset: false,
            drawOnChartArea: false,
            drawBorder: false,
            drawTicks: true,
          },
          ticks: {
            padding: 0,
            font: genTickFont,
            callback: function(value: string, index: number): string {
              const that = this as unknown as CategoryScale
              return genTickLabel(that, value, index)
            },
          },
          title: {
            display: chartOptions.indexAxis === 'x'
              ? !isNullOrUndef(chartOptions.metricAxesTitle?.value)
              : !isNullOrUndef(chartOptions.dimensionAxesTitle?.value),
            text: chartOptions.indexAxis === 'x'
              ? chartOptions.metricAxesTitle?.value
              : chartOptions.dimensionAxesTitle?.value,
            padding: { bottom: 3, top: 0, left: 0, right: 0 },
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
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  })

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (Tooltip.positioners[positionKey]) {
        delete Tooltip.positioners[positionKey]
      }
    })
  }


  return options
}

declare module 'chart.js' {
  interface TooltipPositionerMap {
    [key: string]: TooltipPositionerFunction<ChartType>
  }
  interface InteractionModeMap {
    customInteractionMode: InteractionModeFunction
  }
}
