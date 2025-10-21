<template>
  <div class="kong-ui-public-analytics-echarts">
    <VChart
      ref="chart"
      class="chart"
      :option="option"
      @zr:mousemove="handleMouseMove"
    />
  </div>
</template>

<script setup lang="ts">

import { BarChart, LineChart } from 'echarts/charts'
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BrushComponent,
  ToolboxComponent,
} from 'echarts/components'
import { provide, toRef, useTemplateRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

use([
  SVGRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BrushComponent,
  ToolboxComponent,
])

provide(THEME_KEY, 'light')

const {
  data,
} = defineProps<{
  data: ExploreResultV4
}>()

const chartRef = useTemplateRef('chart')

const option = composables.useExploreResultToEchartTimeseries(
  { exploreResult: toRef(() => data) },
)

const handleMouseMove = () => {
  chartRef.value?.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'brush',
    brushOption: {
      brushType: 'lineX',
      brushMode: 'single',
    },
  })
}

</script>

<style lang="scss" scoped>
.kong-ui-public-analytics-echarts {
  height: 100%;
  width: 100%;
}
</style>
