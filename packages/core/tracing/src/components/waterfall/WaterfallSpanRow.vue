<template>
  <div
    :class="['waterfall-row', 'waterfall-span-row', { selected }]"
    @click="handleSelect"
  >
    <div class="label">
      <template v-if="depth > 1">
        <WaterfallSpacer
          v-for="(_, spacerIndex) in depth - 1"
          :key="`spacer-${spacerIndex}`"
          :type="SpacerType.Ruler"
        />
      </template>

      <WaterfallSpacer
        v-if="(depth || 0) > 0"
        :type="spacerType"
      />

      <WaterfallTreeControl
        :expanded="expanded"
        :invisible="!hasChildren"
        @click.stop="handleExpand"
      />

      <div class="label-content">
        <KTooltip
          class="name"
          :text="spanNode.span.name"
        >
          <div class="name">
            {{ spanNode.span.name }}
          </div>
        </KTooltip>

        <div class="end-decorator">
          <WarningIcon
            v-if="hasException"
            class="exception-mark"
            :color="KUI_COLOR_TEXT_WARNING"
            :size="KUI_FONT_SIZE_30"
          />

          <div class="duration">
            {{ format(spanNode.durationNano) }}
          </div>
        </div>
      </div>
    </div>

    <div class="bar-wrapper">
      <div class="bar" />
    </div>
  </div>

  <template v-if="expanded && spanNode.children">
    <WaterfallSpanRow
      v-for="(child, i) in spanNode.children"
      :key="`${spanNode.span.traceId}-${child.span.spanId}`"
      :depth="(depth || 0) + 1"
      :index="i"
      :sibling-count="spanNode.children.length - 1"
      :span-node="child"
    />
  </template>
</template>

<script lang="ts" setup>
import { KUI_COLOR_TEXT_WARNING, KUI_FONT_SIZE_30 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'
import { computed, inject, ref, watch, type PropType, type Ref } from 'vue'
import composables from '../../composables'
import { SPAN_EVENT_ATTRIBUTES, WATERFALL_CONFIG, WATERFALL_LEGENDS, WATERFALL_ROWS_STATE, WATERFALL_SPAN_BAR_FADING_WIDTH, WaterfallLegendItemKind, WaterfallRowsState } from '../../constants'
import { type SpanNode, type WaterfallConfig } from '../../types'
import WaterfallTreeControl from './WaterfallTreeControl.vue'
import WaterfallSpacer, { SpacerType } from './WaterfallTreeSpacer.vue'

const format = composables.useDurationFormatter()

const config = inject<WaterfallConfig>(WATERFALL_CONFIG)!
const rowsState = inject<Ref<WaterfallRowsState>>(WATERFALL_ROWS_STATE)!

const props = defineProps({
  spanNode: {
    type: Object as PropType<SpanNode>,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0,
  },
  index: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0,
  },
  /**
   * The SIBLING COUNT of the span nodes on the same level.
   * Note: This DOES NOT count the current node itself.
   */
  siblingCount: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0,
  },
})

const expanded = ref(rowsState.value === WaterfallRowsState.EXPANDED)

const selected = computed(
  () =>
    config.selectedSpan?.span.traceId === props.spanNode.span.traceId &&
    config.selectedSpan?.span.spanId === props.spanNode.span.spanId,
)

const hasChildren = computed(
  () =>
    props.spanNode.children !== undefined && props.spanNode.children.length > 0,
)

const spacerType = computed(() => {
  if (expanded.value && props.index !== props.siblingCount) {
    return SpacerType.Attach
  }

  if (props.index === props.siblingCount) {
    return SpacerType.CornerAttach
  }

  return SpacerType.Attach
})

const hasException = computed(() =>{
  if (!Array.isArray(props.spanNode.span.events)) {
    return false
  }

  for (const event of props.spanNode.span.events) {
    for (const keyValue of event.attributes) {
      if (keyValue.key === SPAN_EVENT_ATTRIBUTES.EXCEPTION_MESSAGE.name) {
        return true
      }
    }
  }

  return false
})

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

watch(rowsState, (value) => {
  if (value !== WaterfallRowsState.OVERRIDDEN) {
    expanded.value = value === WaterfallRowsState.EXPANDED
  }
})

const handleExpand = () => {
  if (hasChildren.value) {
    // If the user manually expands or collapses the row, we should set the state to OVERRIDDEN.
    if (rowsState.value !== WaterfallRowsState.OVERRIDDEN) {
      rowsState.value = WaterfallRowsState.OVERRIDDEN
    }
    expanded.value = !expanded.value
  }
}

const handleSelect = () => {
  if (config.selectedSpan?.span.traceId === props.spanNode.span.traceId && config.selectedSpan?.span.spanId === props.spanNode.span.spanId) {
    config.selectedSpan = undefined
  } else {
    config.selectedSpan = props.spanNode
  }
}
</script>

<style lang="scss" scoped>
.waterfall-span-row {
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  width: 100%;

  &.selected {
    $row-background-color: $kui-color-background-primary-weakest;
    background-color: $row-background-color;

    .bar-wrapper {
      &::before {
        background: linear-gradient(to right,
        $row-background-color 0%,
        rgba($row-background-color, 0) 50%,
        rgba($row-background-color, 0) 100%);
      }

      &::after {
        background: linear-gradient(to left,
        $row-background-color 0%,
        rgba($row-background-color, 0) 50%,
        rgba($row-background-color, 0) 100%);
      }
    }
  }

  .label {
    align-items: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-20;
    justify-content: flex-start;
    position: relative;
    width: 100%;

    .label-content {
      align-items: center;
      border-bottom: 1px solid $kui-color-border-neutral-weaker;
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-content: space-between;
      min-width: 0;
      padding: $kui-space-20 $kui-space-10;
      width: 100%;

      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .end-decorator {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: $kui-space-20;
        justify-content: flex-end;

        .duration {
          font-size: $kui-font-size-20;
        }
      }
    }
  }

  &:last-child {
    .label-content {
      border-bottom: none;
    }
  }

  .bar-wrapper {
    align-items: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-30;
    justify-content: flex-start;
    overflow: hidden;
    padding: $kui-space-20 v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
    position: relative;

    &::before {
      background: linear-gradient(to right,
      white 0%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0) 100%);
      content: "";
      display: block;
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
      z-index: 10;
    }

    &::after {
      background: linear-gradient(to left,
      white 0%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0) 100%);
      content: "";
      display: block;
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
      z-index: 10;
    }

    .bar {
      height: 12px;
      position: relative;
      width: 100%;
      z-index: 1;

      &::after {
        background-color: v-bind(barColor);
        border-radius: $kui-border-radius-20;
        content: "";
        height: 100%;
        left: v-bind("`${barShift * 100}%`");
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
  }
}
</style>
