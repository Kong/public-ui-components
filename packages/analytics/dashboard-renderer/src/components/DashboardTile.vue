<template>
  <div class="tile-boundary">
    <component
      :is="componentData.component"
      v-if="componentData"
      v-bind="componentData.rendererProps"
      @edit-tile="onEditTile"
    />
  </div>
</template>
<script setup lang="ts">
import type { DashboardRendererContextInternal, DashboardTileType, TileDefinition } from '../types'
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
import TopNTableRenderer from './TopNTableRenderer.vue'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition,
  context: DashboardRendererContextInternal,
  height?: number,
  queryReady: boolean,
}>(), {
  height: DEFAULT_TILE_HEIGHT,
})

const emit = defineEmits<{
  (e: 'edit-tile', tile: TileDefinition): void
}>()

const rendererLookup: Record<DashboardTileType, Component | undefined> = {
  'timeseries_line': TimeseriesChartRenderer,
  'horizontal_bar': BarChartRenderer,
  'vertical_bar': BarChartRenderer,
  'gauge': SimpleChartRenderer,
  'golden_signals': GoldenSignalsRenderer,
  'top_n': TopNTableRenderer,
  'slottable': undefined,
}

const componentData = computed(() => {
  // Ideally, Typescript would ensure that the prop types of the renderers match
  // the props that they're going to receive.  Unfortunately, actually doing this seems difficult.
  const component = rendererLookup[props.definition.chart.type]
  return component && {
    component,
    rendererProps: {
      query: props.definition.query,
      context: props.context,
      queryReady: props.queryReady,
      chartOptions: props.definition.chart,
      height: props.height - PADDING_SIZE * 2,
      editable: props.definition.editable,
    },
  }
})

const onEditTile = () => {
  emit('edit-tile', props.definition)
}
</script>

<style lang="scss" scoped>
.tile-boundary {
  height: v-bind('`${height}px`');
}
</style>
