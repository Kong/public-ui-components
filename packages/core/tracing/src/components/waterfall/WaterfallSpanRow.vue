<template>
  <div
    :class="['waterfall-row', 'waterfall-span-row', { selected }]"
    @click="handleSelect"
  >
    <div class="label">
      <WaterfallSpacer
        v-if="depth > 1"
        :ruler-indents="depth - 1"
        :type="SpacerType.Ruler"
      />

      <WaterfallSpacer
        v-if="depth > 0"
        :type="spacerType"
      />

      <WaterfallTreeControl
        :expanded="expanded"
        :invisible="!hasChildren"
        @click.stop="handleExpand"
      />

      <div class="label-content">
        <div
          class="name"
          :title="spanNode.span.name"
        >
          {{ spanNode.span.name }}
        </div>

        <div class="end-decorator">
          <WarningIcon
            v-if="hasException"
            :color="KUI_COLOR_TEXT_WARNING"
            :size="KUI_FONT_SIZE_30"
          />

          <DangerIcon
            v-if="maybeIncomplete"
            :color="KUI_COLOR_TEXT_DANGER"
            :size="KUI_FONT_SIZE_30"
          />

          <div
            v-else
            class="duration"
          >
            {{ fmt(spanNode.durationNano) }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!maybeIncomplete"
      class="bar-wrapper"
    >
      <WaterfallSpanBar :span-node="spanNode" />
    </div>
  </div>

  <template v-if="expanded && spanNode.children">
    <WaterfallSpanRow
      v-for="(child, i) in spanNode.children"
      :key="`${spanNode.span.traceId}-${child.span.spanId}`"
      :depth="depth + 1"
      :index="i"
      :sibling-count="spanNode.children.length - 1"
      :span-node="child"
    />
  </template>
</template>

<script lang="ts" setup>
import { KUI_COLOR_TEXT_DANGER, KUI_COLOR_TEXT_WARNING, KUI_FONT_SIZE_30 } from '@kong/design-tokens'
import { DangerIcon, WarningIcon } from '@kong/icons'
import { computed, inject, ref, watch, type PropType, type Ref } from 'vue'
import { SPAN_EVENT_ATTRIBUTE_KEYS, WATERFALL_CONFIG, WATERFALL_ROWS_STATE, WATERFALL_SPAN_BAR_FADING_WIDTH, WaterfallRowsState } from '../../constants'
import { type SpanNode, type WaterfallConfig } from '../../types'
import { getDurationFormatter, spanMaybeIncomplete } from '../../utils'
import WaterfallSpanBar from './WaterfallSpanBar.vue'
import WaterfallTreeControl from './WaterfallTreeControl.vue'
import WaterfallSpacer, { SpacerType } from './WaterfallTreeSpacer.vue'

const fmt = getDurationFormatter()

const config = inject<WaterfallConfig>(WATERFALL_CONFIG)
const rowsState = inject<Ref<WaterfallRowsState>>(WATERFALL_ROWS_STATE)
if (!config) {
  throw new Error('WATERFALL_CONFIG is not provided')
} else if (!rowsState) {
  throw new Error('WATERFALL_ROWS_STATE is not provided')
}

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

const hasChildren = computed(() =>
  props.spanNode.children !== undefined && props.spanNode.children.length > 0,
)

const lastChild = computed(() => props.index === props.siblingCount)

const spacerType = computed(() => {
  if (hasChildren.value) {
    if (expanded.value || !lastChild.value) {
      return SpacerType.Attach
    }

    return SpacerType.CornerAttach
  }

  return lastChild.value ? SpacerType.CornerAttach : SpacerType.Attach
})

const hasException = computed(() => {
  if (!Array.isArray(props.spanNode.span.events)) {
    return false
  }

  for (const event of props.spanNode.span.events) {
    if (!event.attributes) {
      continue
    }
    for (const keyValue of event.attributes) {
      if (keyValue.key === SPAN_EVENT_ATTRIBUTE_KEYS.EXCEPTION_MESSAGE) {
        return true
      }
    }
  }

  return false
})

const maybeIncomplete = computed(() => spanMaybeIncomplete(props.spanNode))

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

  &:hover, &.selected {
    $row-background-color: $kui-color-background-primary-weakest;
    background-color: $row-background-color;

    .bar-wrapper {
      &::before {
        background: linear-gradient(to right, $row-background-color 0%, rgba($row-background-color, 0) 50%, rgba($row-background-color, 0) 100%);
      }

      &::after {
        background: linear-gradient(to left, $row-background-color 0%, rgba($row-background-color, 0) 50%, rgba($row-background-color, 0) 100%);
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
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-content: space-between;
      min-width: 0;
      padding: $kui-space-20 $kui-space-10;
      position: relative;
      width: 100%;

      &::after {
        border-bottom: 1px solid $kui-color-border-neutral-weaker;
        bottom: 0;
        content: '';
        left: 0;
        position: absolute;
        width: 100%;
      }

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
      &::after {
        border-bottom: none;
      }
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
      background: linear-gradient(to right, white 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 100%);
      content: '';
      display: block;
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
      z-index: 10;
    }

    &::after {
      background: linear-gradient(to left, white 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 100%);
      content: '';
      display: block;
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
      z-index: 10;
    }
  }
}
</style>
