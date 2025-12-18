<template>
  <div
    v-if="state.showTooltip"
    ref="tooltipEl"
    class="tooltip-container"
    :class="{ 'locked': state.interactionMode === 'interactive' }"
    :style="{
      transform: isInteractive ? `translate(${dragLeft}, ${dragTop})` : `translate(${absoluteLeft}, ${absoluteTop})`,
      left: '0',
      top: '0',
      pointerEvents: isInteractive ? 'all' : 'none',
    }"
  >
    <ZoomTimerange
      v-if="state.interactionMode === 'selecting-chart-area' && granularity && zoomTimeRange && zoomTimeRange.end && zoomTimeRange.start"
      :end="zoomTimeRange?.end"
      :granularity="granularity"
      :start="zoomTimeRange?.start"
    />
    <ZoomActions
      v-else-if="state.interactionMode === 'zoom-interactive' && zoomTimeRange && zoomActionItems && granularity"
      :granularity="granularity"
      :new-time-range="zoomTimeRange"
      :zoom-action-items="zoomActionItems"
      @on-action="emit('onAction')"
    />
    <div v-else>
      <div class="tooltip-title">
        <div class="title">
          <div>{{ tooltipTitle }}</div>
          <DragIcon
            v-if="isInteractive"
            class="drag-icon"
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="KUI_ICON_SIZE_30"
          />
        </div>
        <div
          v-if="context || metric"
          class="subtitle"
        >
          <div class="context">
            {{ context }}
          </div>
          <div class="metric">
            {{ metric }}
          </div>
        </div>
      </div>
      <ul class="tooltip">
        <template
          v-for="({ backgroundColor, borderColor, label, value, isSegmentEmpty }, index) in (state.tooltipSeries as any)"
          :key="label + index"
        >
          <li v-if="state.tooltipSeries.length">
            <div
              class="square-marker"
              :style="{ background: backgroundColor, 'border-color': borderColor }"
            />
            <span
              class="display-label"
              :class="{ empty: isSegmentEmpty }"
            >{{ label }}</span>
            <span class="display-value">{{ value }}</span>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DragIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import type { TooltipState, ZoomActionItem } from 'src/types'
import type { AbsoluteTimeRangeV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import ZoomActions from '../ZoomActions.vue'
import ZoomTimerange from '../ZoomTimerange.vue'
import { useDraggable } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'dimensions', dimensions: { width: number, height: number }): void
  (e: 'onAction'): void
}>()

const props = withDefaults(defineProps<{
  state: TooltipState
  tooltipTitle?: string
  absoluteLeft?: string
  absoluteTop?: string
  zoomTimeRange?: AbsoluteTimeRangeV4
  zoomActionItems?: ZoomActionItem[]
  granularity?: GranularityValues
}>(), {
  tooltipTitle: '',
  absoluteLeft: '0px',
  absoluteTop: '0px',
  zoomTimeRange: undefined,
  zoomActionItems: undefined,
  granularity: undefined,
})

const tooltipEl = ref<HTMLElement | null>(null)
const { x: dragX, y: dragY, isDragging } = useDraggable(tooltipEl, {
  initialValue: {
    x: parseFloat(props.absoluteLeft),
    y: parseFloat(props.absoluteTop),
  },
})

const dragTop = computed(() => `${dragY.value}px`)
const dragLeft = computed(() => `${dragX.value}px`)

const context = computed(() => {
  return props.state.tooltipContext
})

const metric = computed(() => {
  return props.state.metricDisplay
})

const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(props.state.interactionMode)
})

// Keep dragX and dragY in sync with absoluteLeft and absoluteTop when not dragging
watch(() => [props.absoluteLeft, props.absoluteTop], ([left, top]) => {
  if (!isDragging.value) {
    dragX.value = parseFloat(left)
    dragY.value = parseFloat(top)
  }
})

watch(isDragging, (dragging) => {
  if (dragging) {
    document.body.classList.add('no-select')
  } else {
    document.body.classList.remove('no-select')
  }
})

watch(tooltipEl, value => {
  if (value) {
    const { width, height } = value.getBoundingClientRect()

    emit('dimensions', { width, height })
  }
})

</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.locked {
  cursor: move;
}

.tooltip-container {
  background-color: $kui-color-background;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.24);
  max-width: 425px;
  position: fixed;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 1;

  .tooltip-title {
    @include tooltipTitle;
    padding-bottom: var(--kui-space-20, $kui-space-20);
  }

  .tooltip {
    list-style: none;
    margin: var(--kui-space-30, $kui-space-30);
    max-height: 300px;
    min-width: 250px;
    overflow-y: var(--kui-space-auto, $kui-space-auto);
    padding-left: var(--kui-space-0, $kui-space-0);

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      @include scrollbarBase;
    }

    li {
      align-items: center;
      display: flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
    }

    .display-label {
      flex: 1;
      max-width: 75%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.empty {
        font-style: italic;
      }
    }

    .display-value {
      margin-left: var(--kui-space-auto, $kui-space-auto);
      padding-left: var(--kui-space-40, $kui-space-40);
      white-space: nowrap;
    }

    .square-marker {
      display: inline-flex;
      flex-direction: row;
      height: 12px;
      margin-right: var(--kui-space-30, $kui-space-30);
      width: 12px;
    }
  }
}
</style>

<style lang="css">
.no-select {
  user-select: none;
}
</style>
