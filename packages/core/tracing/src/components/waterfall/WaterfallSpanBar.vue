<template>
  <div class="bar" />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { WATERFALL_CONFIG, WATERFALL_LEGENDS, WATERFALL_SPAN_BAR_FADING_WIDTH, WaterfallLegendItemKind } from '../../constants'
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

/**
 * Left position of the span bar in the whole trace, presented by a ratio where 0 marks the left-most
 * position and 1 marks the right-most position. It is calculated by the following formula:
 *
 * ```
 * (span_start_time - root_start_time) / (total_duration - minimal_duration)
 *                                                         ^ reserve space for spans that are too short
 * ```
 *
 * Note: The value is calculated without the zoom factor to reduce unnecessary recalculations.
 */
const barUnscaledLeftBaseRatio = computed(() => {
  if (!config.root) {
    return 0
  }

  const relativeStart = Number(BigInt(props.spanNode.span.startTimeUnixNano) - (config.root?.subtreeValues.startTimeUnixNano ?? 0n))

  return (relativeStart / (config.totalDurationNano - config.root.subtreeValues.minDurationNano))
})

/**
 * Scaled left position of the span bar with the zoom factor applied.
 */
const barLeftBaseRatio = computed(() => barUnscaledLeftBaseRatio.value * config.zoom)

/**
 * Scaled viewport left position with the zoom factor applied. It is calculated by the following formula:
 */
const viewportLeftRatio = computed(() => config.viewport.left * config.zoom)

/**
 * Left position of the span bar in the whole trace. This is the raw left position that may overflow
 * the viewport a lot, which may bring performance issues.
 */
const barUnclampedLeft = computed(() => {
  if (!config.root) {
    return 0
  }

  return `calc((100% - ${MIN_WIDTH}px) * ${barLeftBaseRatio.value} - 100% * ${viewportLeftRatio.value})`
})

/**
 * Clamped left position of the span bar within the viewport with fading edges on both ends, to ensure
 * the performance. It is clamped in the following range:
 *
 * ```
 * -fading_width <= position <= 100% + fading_width / 2
 * ```
 */
const barLeft = computed(() =>
  `min(calc(100% + ${WATERFALL_SPAN_BAR_FADING_WIDTH} / 2), max(-${WATERFALL_SPAN_BAR_FADING_WIDTH}, ${barUnclampedLeft.value}))`,
)

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

/**
 * Clamped right position of the span bar within the viewport with fading edges on both ends, to ensure
 * the performance. It is clamped in the following range:
 *
 * ```
 * -fading_width <= position <= 100% + fading_width / 2
 * ```
 */
const barRight = computed(() => {
  // The unclamped but scaled width of the span bar with zoom factor applied
  const unclampedWidth = `calc((${MIN_WIDTH}px + (100% - ${MIN_WIDTH}px) * ${barExtraWidthFactor.value}) * ${config.zoom})`

  /**
   * Right position of the span bar in the whole trace. This is the raw right position that may overflow
   * the viewport a lot, which may bring performance issues.
   */
  const unclampedRight = `calc(100% - ${barUnclampedLeft.value} - ${unclampedWidth})`

  return `min(calc(100% + ${WATERFALL_SPAN_BAR_FADING_WIDTH} / 2), max(-${WATERFALL_SPAN_BAR_FADING_WIDTH}, ${unclampedRight}))`
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
    left: v-bind(barLeft);
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
