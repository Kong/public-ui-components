<template>
  <div class="tile-boundary">
    <component
      :is="componentData.component"
      v-if="componentData"
      v-bind="componentData.rendererProps"
    />
  </div>
</template>
<script setup lang="ts">
import { ChartTypes, type DashboardRendererContext, type TileDefinition } from '../types'
import type {
  Component,
} from 'vue'
import { computed } from 'vue'
import '@kong-ui-public/analytics-chart/dist/style.css'
import '@kong-ui-public/analytics-metric-provider/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'
import BarChartRenderer from './BarChartRenderer.vue'
import { DEFAULT_TILE_HEIGHT } from '../constants'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import GoldenSignalsRenderer from './GoldenSignalsRenderer.vue'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition,
  context: DashboardRendererContext,
  height?: number
}>(), {
  height: DEFAULT_TILE_HEIGHT,
})

const rendererLookup: Record<ChartTypes, Component> = {
  [ChartTypes.TimeseriesLine]: TimeseriesChartRenderer,
  [ChartTypes.HorizontalBar]: BarChartRenderer,
  [ChartTypes.VerticalBar]: BarChartRenderer,
  [ChartTypes.Gauge]: SimpleChartRenderer,
  [ChartTypes.GoldenSignals]: GoldenSignalsRenderer,
}

const componentData = computed(() => {
  // Ideally, Typescript would ensure that the prop types of the renderers match
  // the props that they're going to receive.  Unfortunately, actually doing this seems difficult.
  const component = rendererLookup[props.definition.chart.type]
  return {
    component,
    rendererProps: {
      query: props.definition.query,
      context: props.context,
      queryReady: true, // TODO: Pipelining
      chartOptions: props.definition.chart,
      height: props.height - PADDING_SIZE * 2,
    },
  }
})
</script>
