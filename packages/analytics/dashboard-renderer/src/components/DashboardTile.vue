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
import type { TileDefinition } from '../types'
import { ChartTypes } from '../types'
import type {
  Component, PropType,
} from 'vue'
import { computed } from 'vue'
import '@kong-ui-public/analytics-chart/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'
import BarChartRenderer from './BarChartRenderer.vue'
import { DEFAULT_TILE_HEIGHT } from '../constants'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'

const props = defineProps({
  definition: {
    type: Object as PropType<TileDefinition>,
    required: true,
  },
  height: {
    type: Number,
    required: false,
    default: () => DEFAULT_TILE_HEIGHT,
  },
})

const rendererLookup: Record<ChartTypes, Component> = {
  [ChartTypes.TimeseriesLine]: TimeseriesChartRenderer,
  [ChartTypes.HorizontalBar]: BarChartRenderer,
  [ChartTypes.VerticalBar]: BarChartRenderer,
  [ChartTypes.Gauge]: SimpleChartRenderer,
}

const componentData = computed(() => {
  // Ideally, Typescript would ensure that the prop types of the renderers match
  // the props that they're going to receive.  Unfortunately, actually doing this seems difficult.
  const component = rendererLookup[props.definition.chart.type]
  return {
    component,
    rendererProps: {
      query: props.definition.query,
      queryReady: true, // TODO: Pipelining
      chartOptions: props.definition.chart,
      height: props.height,
    },
  }
})
</script>
