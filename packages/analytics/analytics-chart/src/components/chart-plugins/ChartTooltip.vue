<template>
  <div
    v-if="state.showTooltip"
    ref="tooltipEl"
    class="tooltip-container"
    :class="{ 'locked': state.state === 'interactive' }"
    :style="{
      transform: isInteractive ? `translate(${dragPosition.left}, ${dragPosition.top})` : `translate(${absoluteLeft}, ${absoluteTop})`,
      left: '0',
      top: '0',
      pointerEvents: isInteractive ? 'all' : 'none'
    }"
    @mousedown="handleMouseDown"
  >
    <ZoomTimerange
      v-if="state.state === 'selecting-chart-area'"
      :end="zoomTimeRange?.end"
      :start="zoomTimeRange?.start"
    />
    <ZoomActions
      v-else-if="state.state === 'zoom-interactive' && zoomTimeRange && zoomOptions"
      :new-time-range="zoomTimeRange"
      :zoom-options="zoomOptions"
      @on-action="emit('onAction')"
    />
    <div v-else>
      <div class="tooltip-title">
        <span class="title">{{ tooltipTitle }}</span>
        <DragIcon
          v-if="isInteractive"
          class="drag-icon"
          :color="KUI_COLOR_TEXT_NEUTRAL"
        />
        <span
          v-if="context"
          class="subtitle"
        >{{ context }}</span>
      </div>
      <ul
        class="tooltip"
      >
        <template
          v-for="{ backgroundColor, borderColor, label, value, isSegmentEmpty } in (state.tooltipSeries as any)"
          :key="label"
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
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { TooltipState } from 'src/types'
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import ZoomActions from '../ZoomActions.vue'
import type { ZoomOptions } from '../ZoomActions.vue'
import ZoomTimerange from '../ZoomTimerange.vue'

const emit = defineEmits<{
  (e: 'dimensions', dimensions: { width: number, height: number }): void
  (e: 'top', top: string): void
  (e: 'left', left: string): void
  (e: 'onAction'): void
}>()

const props = withDefaults(defineProps<{
  state: TooltipState
  tooltipTitle?: string
  absoluteLeft?: string
  absoluteTop?: string
  zoomTimeRange?: AbsoluteTimeRangeV4
  zoomOptions?: ZoomOptions[]
}>(), {
  tooltipTitle: '',
  absoluteLeft: '0px',
  absoluteTop: '0px',
  zoomTimeRange: undefined,
  zoomOptions: undefined,
  dragSelectPlugin: undefined,
})

const tooltipEl = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dragStartPosition = ref({ x: 0, y: 0 })
const dragMouseStartPosition = ref({ x: 0, y: 0 })
const dragPosition = ref({ left: props.absoluteLeft, top: props.absoluteTop })

const context = computed(() => {
  return props.state.tooltipContext
})

const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(props.state.state)
})

watch(tooltipEl, value => {
  if (value) {
    const { width, height } = value.getBoundingClientRect()

    emit('dimensions', { width, height })
  }
})

watch(() => props.state.state, value => {
  // TODO: Remove
  console.log(value)
  if (['interactive', 'zoom-interactive'].includes(value)) {
    dragPosition.value.left = props.absoluteLeft
    dragPosition.value.top = props.absoluteTop
  }
})

function handleMouseDown(e: MouseEvent) {
  if (tooltipEl.value) {
    dragging.value = true
    document.body.classList.add('no-select')
    // Get computed style and extract transform values
    const style = window.getComputedStyle(tooltipEl.value as HTMLElement)
    // @ts-ignore mozTransform is not in the types
    const transform = style.transform || style.webkitTransform || style.mozTransform

    // Generate the transform matrix for the tooltip element
    const matrix = new DOMMatrix(transform)
    // 4th column in the matrix represents the translations
    // m41 and m42 are the x and y translations respectively
    // https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix
    const translateX = matrix.m41
    const translateY = matrix.m42

    // Set initial drag positions
    dragStartPosition.value = { x: translateX, y: translateY }
    dragMouseStartPosition.value = { x: e.clientX, y: e.clientY }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }
}

let animationFrameId: number | null = null

/**
 * Mousemove events fire at a high rate which cause performance issues with Vue.js reactivity system,
 * leading to slow/choppy animation when dragging.
 *
 * In order to ensure that the tooltip position is updated only once per frame, use the requestAnimationFrame method
 * to schedule the update. The requestAnimationFrame method tells the browser to perform an animation
 * and requests that the browser call a specified function to update an animation before the next repaint.
 *
 * If the function is called multiple times before the next repaint (which could happen with mousemove events),
 * the previous frame is cancelled and the latest frame is requested.
 */
function handleMouseMove(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (dragging.value) {

    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = window.requestAnimationFrame(() => {
      const dx = e.clientX - dragMouseStartPosition.value.x
      const dy = e.clientY - dragMouseStartPosition.value.y

      dragPosition.value.left = `${dragStartPosition.value.x + dx}px`
      dragPosition.value.top = `${dragStartPosition.value.y + dy}px`
    })
  }
}

function handleMouseUp() {
  dragging.value = false
  document.body.classList.remove('no-select')
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

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
  min-width: 250px;
  position: absolute;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 999;

  .tooltip-title {
    @include tooltipTitle;

    .drag-icon {
      margin-top: var(--kui-space-30, $kui-space-30);
      position: absolute;
      right: 0;
      top: 0;
    }
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
