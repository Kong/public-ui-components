<template>
  <div
    ref="chartContainerRef"
    class="vega-lite-chart"
  >
    <div
      ref="chartRef"
      class="chart"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, defineProps, useTemplateRef, toRef } from 'vue'
import composables from '../composables'
import { useElementSize } from '@vueuse/core'
import type { VisualizationSpec } from 'vega-embed'
import type { Result } from 'vega-embed'

export interface BaseVegaLiteChartExpose {
  chartInstance: Result
}

const props = defineProps<{
  spec: VisualizationSpec,
}>()

const chartRef = useTemplateRef<HTMLDivElement>('chartRef')
const chartContainerRef = useTemplateRef<HTMLDivElement>('chartContainerRef')
const { height } = useElementSize(chartContainerRef)
const { chartInstance } = composables.useVegaLite(chartRef, toRef(props, 'spec'))

watch(height, () => {
  chartInstance.value?.view.height(height.value).run()
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
