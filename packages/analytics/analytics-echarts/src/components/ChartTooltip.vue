<template>
  <div
    v-if="state.visible"
    ref="toolip"
    class="chart-tooltip"
    :style="{
      transform: isInteractive ? `translate(${dragLeft}, ${dragTop})` : `translate(${left}, ${top})`,
      pointerEvents: isInteractive ? 'all' : 'none',
    }"
  >
    <ZoomTimerange
      v-if="state.interactionMode === 'selecting-chart-area' && brushTimeRange && granularity"
      :end="brushTimeRange?.end"
      :granularity="granularity"
      :start="brushTimeRange?.start"
    />
    <ZoomActions
      v-else-if="state.interactionMode === 'zoom-interactive' && brushTimeRange && zoomActionItems && granularity"
      :granularity="granularity"
      :new-time-range="brushTimeRange"
      :zoom-action-items="zoomActionItems"
      @on-action="emit('onAction')"
    />
    <div v-else>
      <div class="tooltip-title">
        <div class="title">
          <div>{{ state.title }}</div>
        </div>
        <div
          v-if="state.subtitle || state.metricDisplay"
          class="subtitle"
        >
          <div class="context">
            {{ state.subtitle }}
          </div>
          <div class="metric">
            {{ state.metricDisplay }}
          </div>
        </div>
      </div>
      <div class="tooltip-content">
        <div
          v-for="item in state.entries"
          :key="`${item.label}-${item.value}`"
          class="tooltip-item"
        >
          <div
            class="square-marker"
            :style="{ background: item.backgroundColor, 'border-color': item.borderColor }"
          />
          <div class="tooltip-item-label">
            {{ item.label }}
          </div>
          <div class="tooltip-item-value">
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AbsoluteTimeRangeV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import { useElementSize, useDraggable } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'
import ZoomActions, { type ZoomActionItem } from './ZoomActions.vue'
import ZoomTimerange from './ZoomTimerange.vue'

export interface TooltipEntry {
  backgroundColor: string
  borderColor: string
  label: string
  value: string | number
  rawValue: number
  isSegmentEmpty?: boolean
}

export interface TooltipState {
  interactionMode: 'idle' | 'interactive' | 'selecting-chart-area' | 'zoom-interactive'
  entries: TooltipEntry[]
  visible: boolean
  top: number
  left: number
  title?: string
  subtitle?: string
  metricDisplay?: string
}

const {
  state,
  brushTimeRange = undefined,
  granularity = undefined,
  zoomActionItems = undefined,
} = defineProps<{
  state: TooltipState
  brushTimeRange?: AbsoluteTimeRangeV4
  granularity?: GranularityValues
  zoomActionItems?: ZoomActionItem[]
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

const tooltipRef = useTemplateRef('toolip')
const { width, height } = useElementSize(tooltipRef)
const { x: dragX, y: dragY, isDragging } = useDraggable(tooltipRef, {
  initialValue: {
    x: state.left,
    y: state.top,
  },
})

const top = computed(() => `${state.top}px`)
const left = computed(() => `${state.left}px`)
const dragTop = computed(() => `${dragY.value}px`)
const dragLeft = computed(() => `${dragX.value}px`)
const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(state.interactionMode)
})

watch(() => [state.left, state.top], ([left, top]) => {
  if (!isDragging.value && !isInteractive.value) {
    dragX.value = left
    dragY.value = top
  }
})

watch(isDragging, (dragging) => {
  if (dragging) {
    document.body.classList.add('no-select')
  } else {
    document.body.classList.remove('no-select')
  }
})

defineExpose({
  width,
  height,
})

</script>

<style scoped lang="scss">
@use "../styles/mixins.scss" as *;

.chart-tooltip {
  background-color: $kui-color-background;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.24);
  left: 0;
  max-width: 425px;
  position: fixed;
  top: 0;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 1;

  .tooltip-title {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: column;
    margin: var(--kui-space-30, $kui-space-30) var(--kui-space-30, $kui-space-30) 0 var(--kui-space-30, $kui-space-30);
    min-height: 24px;

    .title {
      display: flex;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      justify-content: space-between;

      .drag-icon {
        margin-top: var(--kui-space-30, $kui-space-30);
        right: 0;
        top: 0;
      }
    }

    .subtitle {
      display: flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      gap: var(--kui-space-40, $kui-space-40);
      justify-content: space-between;
      margin-top: var(--kui-space-30, $kui-space-30);
    }
  }

  .tooltip-content {
    margin: var(--kui-space-30, $kui-space-30);
    max-height: 300px;
    min-width: 250px;
    overflow-y: var(--kui-space-auto, $kui-space-auto);
    padding-left: var(--kui-space-0, $kui-space-0);
    @include scrollbarBase;

    .tooltip-item {
      align-items: center;
      display: flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-30, $kui-line-height-30);

      .square-marker {
        display: inline-flex;
        flex-direction: row;
        height: 12px;
        margin-right: var(--kui-space-30, $kui-space-30);
        width: 12px;
      }

      .tooltip-item-label {
        flex: 1;
        max-width: 75%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.empty {
          font-style: italic;
        }
      }

      .tooltip-item-value {
        margin-left: var(--kui-space-auto, $kui-space-auto);
        padding-left: var(--kui-space-40, $kui-space-40);
        white-space: nowrap;
      }
    }
  }
}
</style>
