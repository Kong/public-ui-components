<template>
  <div
    ref="chartContainerRef"
    class="vega-lite-chart"
  >
    <div
      ref="chartRef"
      class="chart"
    />
    <ChartTooltip
      v-if="tooltipData.show"
      ref="tooltipRef"
      :context="tooltipData.context"
      :left="tooltipData.left"
      :locked="tooltipData.locked"
      :series="tooltipData.series"
      :show-tooltip="tooltipData.show"
      :tooltip-title="tooltipData.tooltipTitle"
      :top="tooltipData.top"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, defineProps, useTemplateRef, toRef, ref, computed, onMounted, onUnmounted } from 'vue'
import composables from '../composables'
import { useElementSize } from '@vueuse/core'
import type { VisualizationSpec } from 'vega-embed'
import type { Result } from 'vega-embed'
import ChartTooltip from './ChartTooltip.vue'
import { format } from 'date-fns'
import type { Item, ScenegraphEvent } from 'vega'
import type { QueryResponseMeta } from '@kong-ui-public/analytics-utilities'

export interface BaseVegaLiteChartExpose {
  chartInstance: Result
}

const props = defineProps<{
  spec: VisualizationSpec
  responseMeta: QueryResponseMeta
}>()

const tooltipData = ref<{
  show: boolean
  left: string
  top: string
  tooltipTitle: string
  context: string | number
  series: any[]
  locked: boolean
}>({
  show: false,
  left: '0px',
  top: '0px',
  tooltipTitle: '',
  context: '',
  series: [],
  locked: false,
})

const tooltipRef = useTemplateRef('tooltipRef')
const tooltipEl = computed(() => tooltipRef.value?.$el as HTMLElement | undefined)
const { width: tooltipWidth, height: tooltipHeight } = useElementSize(tooltipEl)
const cachedTooltipWidth = ref(0)
const cachedTooltipHeight = ref(0)

function handleHover(event: ScenegraphEvent, item?: Item<any> | null) {
  const ev = event as MouseEvent
  ev.preventDefault()
  ev.stopPropagation()
  if (item?.datum) {
    const chartRect = chartRef.value?.getBoundingClientRect()
    const chartWidth = chartRect?.width || 0
    const chartHeight = chartRect?.height || 0

    // Cursor position relative to chart
    const x = ev.layerX
    const y = ev.layerY

    const offset = 40

    // Hover event may fire before the tooltip is fully rendered,
    if (tooltipWidth.value > 0 && tooltipHeight.value > 0) {
      cachedTooltipWidth.value = tooltipWidth.value
      cachedTooltipHeight.value = tooltipHeight.value
    }

    // Horizontal positioning
    let left: string
    if (x > chartWidth / 2) {
      // Cursor is in right half, show tooltip to the left
      left = `${x - cachedTooltipWidth.value - offset}px`
    } else {
      // Cursor is in left half, show tooltip to the right
      left = `${x + offset}px`
    }

    // Vertical positioning
    let top: string
    if (y > chartHeight / 2) {
      // Cursor is in bottom half, show tooltip above
      top = `${y - cachedTooltipHeight.value - offset}px`
    } else {
      // Cursor is in top half, show tooltip below
      top = `${y + offset}px`
    }

    const currentTime = item.datum.datum.time
    // Find all data points with this timestamp
    const dataEntries = chartInstance.value?.view.data('chartData')
      .filter(d => new Date(d.time).getTime() === currentTime)

    tooltipData.value = {
      show: true,
      left,
      top,
      tooltipTitle: item.datum.category || 'Tooltip',
      context: format(new Date(item.datum.datum.time), 'MMM dd, yyyy HH:mm:ss'),
      series: dataEntries?.map(entry => {
        if (props.responseMeta.metric_names) {
          if (props.responseMeta.metric_names?.length > 1) {
            return props.responseMeta.metric_names?.map((metricName) => {
              return {
                label: metricName,
                value: entry[metricName],
              }
            })
          }
          return {
            label: entry[Object.keys(props.responseMeta.display)[0]],
            value: entry[props.responseMeta.metric_names[0]],
          }
        }
      }).flat() || [],
      locked: false,
    }
  }
}

function hideTooltip() {
  if (!tooltipData.value.locked) {
    tooltipData.value.show = false
  }
}

function registerTooltipEvents() {
  if (chartInstance.value) {
    chartInstance.value.view.addEventListener('mouseout', hideTooltip)
    chartInstance.value.view.addEventListener('mousemove', handleHover)
  }
}

const chartRef = useTemplateRef<HTMLDivElement>('chartRef')
const chartContainerRef = useTemplateRef<HTMLDivElement>('chartContainerRef')
const { height } = useElementSize(chartContainerRef)
const { chartInstance } = composables.useVegaLite(chartRef, toRef(props, 'spec'))

watch(height, () => {
  chartInstance.value?.view.height(height.value).run()
})

watch(chartInstance, (instance) => {
  if (instance) {
    registerTooltipEvents()
  }
})

onMounted(() => {
  registerTooltipEvents()
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.view.removeEventListener('mouseover', handleHover)
    chartInstance.value.view.removeEventListener('mouseout', hideTooltip)
  }
})

</script>

<style lang="scss" scoped>
.vega-lite-chart {
  height: 100%;
  position: relative;
  width: 100%;
}

.chart {
  height: 100%;
  width: 100%;
}
</style>
