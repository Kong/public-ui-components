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
import { watch, defineProps, useTemplateRef, toRef, ref, onMounted, onUnmounted } from 'vue'
import composables from '../composables'
import { useElementSize } from '@vueuse/core'
import type { VisualizationSpec } from 'vega-embed'
import type { Result } from 'vega-embed'
import ChartTooltip from './ChartTooltip.vue'
import { format } from 'date-fns'

export interface BaseVegaLiteChartExpose {
  chartInstance: Result
}

const props = defineProps<{
  spec: VisualizationSpec,
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


function handleHover(event: any, item: any) {
  event.preventDefault()
  event.stopPropagation()
  tooltipData.value.show = true
  if (item?.datum) {
    tooltipData.value = {
      show: true,
      left: `${event.layerX + 50}px`,
      top: `${event.layerY + 50}px`,
      tooltipTitle: item.datum.category || 'Tooltip',
      context: format(new Date(item.datum.datum.time), 'MMM dd, yyyy HH:mm:ss'),
      series: Object.entries(item.datum.datum).filter(([key]) => key !== 'time').map(([key, value]) => ({ label: key, value })),
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
