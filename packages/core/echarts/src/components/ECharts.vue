<template>
  <div class="kong-ui-public-echarts">
    <VChart
      :autoresize="true"
      class="chart"
      :option="chartOption"
      :theme="theme"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { useChartColors } from '../composables/useChartColors.ts'
import { useChartTheme } from '../composables/useChartTheme.ts'
import { useChartTooltip } from '../composables/useChartTooltip.ts'
import type { EChartsOption, TooltipComponentOption } from 'echarts'
import type { ChartTooltipContent } from '../types/index.ts'

defineOptions({
  name: 'KongECharts',
  // Forward attrs (including echarts event listeners like `@click`) to VChart
  inheritAttrs: false,
})

use([CanvasRenderer, GridComponent, TooltipComponent])

const { option, height = '400px', tooltipContent } = defineProps<{
  option?: EChartsOption
  height?: string
  /** What the shared tooltip shows. Falls back to the hovered category and each series' color, name and value. */
  tooltipContent?: ChartTooltipContent
}>()

const colors = useChartColors()
const theme = useChartTheme(colors)

// Every chart uses the shared tooltip (see `useChartTooltip`)
const tooltipFormatter = useChartTooltip(() => tooltipContent)

const chartOption = computed((): EChartsOption => ({
  ...option,
  tooltip: { ...option?.tooltip as TooltipComponentOption, formatter: tooltipFormatter },
}))
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
