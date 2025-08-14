<template>
  <div class="bar" />
</template>

<script setup lang="ts">
import { KUI_BORDER_RADIUS_20 } from '@kong/design-tokens'
import { computed, inject } from 'vue'
import { WATERFALL_CONFIG, WATERFALL_SPAN_BAR_FADING_WIDTH } from '../../constants'
import type { SpanNode, WaterfallConfig } from '../../types'

const config = inject<WaterfallConfig>(WATERFALL_CONFIG)
if (!config) {
  throw new Error('WATERFALL_CONFIG is not provided')
}

const props = defineProps<{
  spanNode: SpanNode
}>()

const barEdges = computed(() => {
  const spanStart = props.spanNode.span.startTimeUnixNano
  const spanEnd = props.spanNode.span.endTimeUnixNano

  const traceStart = config.root?.subtreeValues.startTimeUnixNano
  const traceEnd = config.root?.subtreeValues.endTimeUnixNano

  if (spanStart === undefined || spanEnd === undefined || traceStart === undefined || traceEnd === undefined) {
    return { left: 0, right: 0 }
  }

  const left = (Number(spanStart - traceStart) / config.totalDurationNano)
  const right = (Number(traceEnd - spanEnd) / config.totalDurationNano)

  return { left, right }
})

const barLeft = computed(() => {
  const unclampedLeft = `calc((100% * ${config.zoom}) * (${barEdges.value.left} - ${config.viewport.left}))`
  return `min(calc(100% + ${WATERFALL_SPAN_BAR_FADING_WIDTH} / 2), max(calc(-${WATERFALL_SPAN_BAR_FADING_WIDTH} - ${KUI_BORDER_RADIUS_20}), ${unclampedLeft}))`
})

const barRight = computed(() => {
  const unclampedRight = `calc((100% * ${config.zoom}) * (${barEdges.value.right} - ${config.viewport.right}))`
  return `min(calc(100% + ${WATERFALL_SPAN_BAR_FADING_WIDTH} / 2), max(calc(-${WATERFALL_SPAN_BAR_FADING_WIDTH} - ${KUI_BORDER_RADIUS_20}), ${unclampedRight}))`
})
</script>

<style lang="scss" scoped>
.bar {
  height: 12px;
  position: relative;
  width: 100%;
  z-index: 1;

  &::after {
    background-color: $kui-color-background-primary;
    border-radius: $kui-border-radius-20;
    content: '';
    height: 100%;
    left: v-bind(barLeft);
    min-width: 1px;
    position: absolute;
    right: v-bind(barRight);
    top: 0;
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
