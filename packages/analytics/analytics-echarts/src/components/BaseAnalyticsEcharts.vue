<template>
  <div
    ref="container"
    class="kong-ui-public-analytics-echarts"
  >
    <VChart
      :key="`${theme}-${renderMode}`"
      ref="chart"
      :autoresize="autoresizeOptions"
      class="chart"
      :init-options="initOptions"
      manual-update
      :option="option"
      @brush="emit('brush', $event)"
      @click="emit('click', $event)"
      @datazoom="emit('datazoom', $event)"
      @zr:click="emit('zr:click', $event)"
      @zr:mousedown="emit('zr:mousedown', $event)"
      @zr:mousemove="emit('zr:mousemove', $event)"
      @zr:mouseout="emit('zr:mouseout', $event)"
      @zr:mouseup="emit('zr:mouseup', $event)"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import VChart, { THEME_KEY } from 'vue-echarts'
import type { ElementEvent } from 'echarts/core'
import { use } from 'echarts/core'
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  BrushComponent,
  ToolboxComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components'
import { computed, provide, toRef, useTemplateRef, watch } from 'vue'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ECElementEvent } from 'echarts/core'
import type { DataZoomPayload } from '../utils/chart-scroll'

type BrushPayload = {
  areas?: Array<{
    coordRange?: number[]
  }>
}

const {
  option,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  option: ECBasicOption
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const emit = defineEmits<{
  // ECharts component events
  (e: 'brush', params: BrushPayload): void
  (e: 'click', params: ECElementEvent): void
  (e: 'datazoom', params: DataZoomPayload): void
  // ZRender events (low-level)
  (e: 'zr:click', event: ElementEvent): void
  (e: 'zr:mousedown', event: ElementEvent): void
  (e: 'zr:mousemove', event: ElementEvent): void
  (e: 'zr:mouseout', event: ElementEvent): void
  (e: 'zr:mouseup', event: ElementEvent): void
}>()

use([
  SVGRenderer,
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  BrushComponent,
  ToolboxComponent,
  MarkLineComponent,
  MarkAreaComponent,
])

provide(THEME_KEY, toRef(() => theme))

const containerRef = useTemplateRef('container')
const chartRef = useTemplateRef('chart')
const initOptions = computed(() => ({
  renderer: renderMode,
}))

const updateOptions = {
  notMerge: true,
  lazyUpdate: false,
} as const

const applyOption = (nextOption: ECBasicOption) => {
  chartRef.value?.setOption(nextOption, updateOptions)
}

const autoresizeOptions = {
  onResize: () => {
    applyOption(option)
  },
} as const

watch(() => option, (newOption) => {
  applyOption(newOption)
})

type ExposedChart = {
  $el?: HTMLElement
  convertFromPixel: (finder: { xAxisIndex: number }, value: number) => number | number[] | undefined
  dispatchAction: (payload: unknown) => void
  setOption: (option: ECBasicOption, opts?: { notMerge?: boolean, lazyUpdate?: boolean }) => void
}

defineExpose({
  getChart: () => chartRef.value as ExposedChart | undefined,
  getContainer: () => containerRef.value,
})
</script>

<style lang="scss" scoped>
.kong-ui-public-analytics-echarts {
  height: 100%;
  width: 100%;

  .chart {
    height: 100%;
    width: 100%;
  }
}
</style>
