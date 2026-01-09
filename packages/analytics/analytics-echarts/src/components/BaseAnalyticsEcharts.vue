<template>
  <div
    ref="container"
    class="kong-ui-public-analytics-echarts"
  >
    <VChart
      :key="`${theme}-${renderMode}`"
      ref="chart"
      :autoresize="true"
      class="chart"
      manual-update
      :option="option"
      @brush="emit('brush', $event)"
      @click="emit('click', $event)"
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
  BrushComponent,
  ToolboxComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components'
import { provide, toRef, useTemplateRef, watch } from 'vue'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ECElementEvent } from 'echarts/core'

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
  (e: 'brush', params: any): void
  (e: 'click', params: ECElementEvent): void
  // ZRender events (low-level)
  (e: 'zr:click', event: ElementEvent): void
  (e: 'zr:mousedown', event: ElementEvent): void
  (e: 'zr:mousemove', event: ElementEvent): void
  (e: 'zr:mouseout', event: ElementEvent): void
  (e: 'zr:mouseup', event: ElementEvent): void
}>()

watch(() => renderMode, (newRenderMode) => {
  use([
    ...(newRenderMode === 'canvas' ? [CanvasRenderer] : []),
    ...(newRenderMode === 'svg' ? [SVGRenderer] : []),
    LineChart,
    BarChart,
    PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    BrushComponent,
    ToolboxComponent,
    MarkLineComponent,
    MarkAreaComponent,
  ])
}, { immediate: true })

provide(THEME_KEY, toRef(() => theme))

const containerRef = useTemplateRef('container')
const chartRef = useTemplateRef('chart')

watch(() => option, (newOption) => {
  chartRef.value?.setOption(newOption, { notMerge: true, lazyUpdate: false })
}, { deep: true })

defineExpose({
  chart: chartRef,
  container: containerRef,
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
