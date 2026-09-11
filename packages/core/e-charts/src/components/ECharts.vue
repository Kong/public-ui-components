<template>
  <div class="kong-ui-public-echarts">
    <VChart
      :autoresize="true"
      class="chart"
      :option="option"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'

defineOptions({
  name: 'KongECharts',
  // Forward attrs (including echarts event listeners like `@click`) to VChart
  inheritAttrs: false,
})

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

const { option, height = '400px' } = defineProps<{
  option?: EChartsOption
  height?: string
}>()
</script>

<style lang="scss" scoped>
.kong-ui-public-echarts {
  // Add component styles as needed
  width: 100%;
}

// ECharts can't render with an auto height; default to 400px, overridable
// via the `height` prop or the host's own CSS
.chart {
  height: v-bind('height');
}
</style>
