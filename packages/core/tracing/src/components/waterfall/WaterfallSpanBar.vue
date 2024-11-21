<template>
  <div class="bar" />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { WATERFALL_CONFIG, WATERFALL_LEGENDS, WaterfallLegendItemKind } from '../../constants'
import type { SpanNode, WaterfallConfig } from '../../types'

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
    return WATERFALL_LEGENDS[WaterfallLegendItemKind.ROOT].color
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
const barFixedLeft = computed(() =>
  ((props.spanNode.span.startTimeUnixNano - config.startTimeUnixNano) / config.totalDurationNano) * config.zoom,
)
const barShiftLeft = computed(() => -config.viewport.left * config.zoom)
const barShift = computed(() => barFixedLeft.value + barShiftLeft.value)
const barWidth = computed(() => {
  return `max(3px, ${props.spanNode.durationNano / config.totalDurationNano * config.zoom * 100}%)`
})
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
    left: v-bind('`${barShift * 100}%`');
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
