<template>
  <div
    ref="tileBoundary"
    class="tile-boundary"
  >
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import '@kong-ui-public/analytics-chart/dist/style.css'
import '@kong-ui-public/analytics-metric-provider/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'
import BarChartRenderer from './BarChartRenderer.vue'
import { DEFAULT_TILE_HEIGHT } from '../constants'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import GoldenSignalsRenderer from './GoldenSignalsRenderer.vue'
import TopNTableRenderer from './TopNTableRenderer.vue'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition,
  context: DashboardRendererContext,
  height?: number,
  fitToContent?: boolean,
}>(), {
  height: DEFAULT_TILE_HEIGHT,
  fitToContent: false,
})

const heightRef = ref(props.height)
const tileBoundary = ref<HTMLDivElement | null>(null)

const resizeObserver = new ResizeObserver(entries => {
  heightRef.value = entries[0].contentRect.height
})

const rendererLookup: Record<ChartTypes, Component | undefined> = {
  [ChartTypes.TimeseriesLine]: TimeseriesChartRenderer,
  [ChartTypes.HorizontalBar]: BarChartRenderer,
  [ChartTypes.VerticalBar]: BarChartRenderer,
  [ChartTypes.Gauge]: SimpleChartRenderer,
  [ChartTypes.GoldenSignals]: GoldenSignalsRenderer,
  [ChartTypes.TopN]: TopNTableRenderer,
  [ChartTypes.Slottable]: undefined,
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
      queryReady: true, // TODO: Pipelining
      chartOptions: props.definition.chart,
      height: heightRef.value - PADDING_SIZE * 2,
    },
  }
})

onMounted(() => {
  if (tileBoundary.value && props.fitToContent) {
    resizeObserver.observe(tileBoundary.value as HTMLDivElement)
  }
})

onUnmounted(() => {
  if (tileBoundary.value) {
    resizeObserver.unobserve(tileBoundary.value as HTMLDivElement)
  }
})

</script>

<style lang="scss" scoped>
.tile-boundary {
  height: v-bind('`${heightRef}px`');
}
</style>
