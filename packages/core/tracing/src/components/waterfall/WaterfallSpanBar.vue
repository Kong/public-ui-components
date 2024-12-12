<template>
  <div class="bar" />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { WATERFALL_CONFIG, WATERFALL_LEGENDS, WaterfallLegendItemKind } from '../../constants'
import type { SpanNode, WaterfallConfig } from '../../types'

const MIN_WIDTH = 1

const config = inject<WaterfallConfig>(WATERFALL_CONFIG)
if (!config) {
  throw new Error('WATERFALL_CONFIG is not provided')
}

const props = defineProps<{
  spanNode: SpanNode
}>()

// TODO: This is not final
const barColor = computed(() => {
  if (props.spanNode.root) {
    return WATERFALL_LEGENDS[WaterfallLegendItemKind.TOTAL].color
  }

  if (props.spanNode.span.name.includes('client')) {
    return WATERFALL_LEGENDS[WaterfallLegendItemKind.CLIENT].color
  }

  if (props.spanNode.span.name.includes('upstream')) {
    return WATERFALL_LEGENDS[WaterfallLegendItemKind.UPSTREAM].color
  }

  if (props.spanNode.span.name === 'kong.dns') {
    return WATERFALL_LEGENDS[WaterfallLegendItemKind.THIRD_PARTY].color
  }

  return WATERFALL_LEGENDS[WaterfallLegendItemKind.KONG].color
})

// RESERVED: Only used when zooming is enabled
const relativeStartTimeNano = computed(() =>
  Number(BigInt(props.spanNode.span.startTimeUnixNano) - (config.root?.subtreeValues.startTimeUnixNano ?? 0n)),
)
const barFixedLeft = computed(() => (relativeStartTimeNano.value / config.totalDurationNano) * config.zoom)
const barShiftLeft = computed(() => -config.viewport.left * config.zoom)
const barLeft = computed(() => `min(100% - ${MIN_WIDTH}px, calc((100% - ${MIN_WIDTH}px) * ${(barFixedLeft.value + barShiftLeft.value)})`)
const barExtraWidthFactor = computed(() => {
  if (!config.root) {
    return 0
  }
  /**
   * We will make minDuration as `MIN_WIDTH`. Therefore, we will calculate the "extra" width besides the
   * `MIN_WIDTH`. We will present this extra width as a factor.
   *
   * e.g.
   * - The total duration should take `MIN_WIDTH + (100% - MIN_WIDTH) * 1` which is `100%` (factor = 1)
   * - The minimal duration should take `MIN_WIDTH + (100% - MIN_WIDTH) * 0` which is `MIN_WIDTH` (factor = 0)
   *
   * Therefore, the formula to calculate the factor for a span is:
   * (span duration - minimal duration) / (total duration - minimal duration)`
   */
  return (props.spanNode.durationNano - config.root.subtreeValues.minDurationNano)
    / (config.totalDurationNano - config.root.subtreeValues.minDurationNano)
})
const barWidth = computed(() =>
  `calc((${MIN_WIDTH}px + (100% - ${MIN_WIDTH}px) * ${barExtraWidthFactor.value}) * ${config.zoom})`,
)
</script>

<style lang="scss" scoped>
.bar {
  height: 12px;
  position: relative;
  width: 100%;
  z-index: 1;

  &::after {
    background-color: v-bind(barColor);
    border-radius: $kui-border-radius-20;
    content: '';
    height: 100%;
    left: v-bind(barLeft);
    position: absolute;
    top: 0;
    width: v-bind(barWidth);
  }

  .bar-label {
    font-size: $kui-font-size-10;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }
}
</style>
