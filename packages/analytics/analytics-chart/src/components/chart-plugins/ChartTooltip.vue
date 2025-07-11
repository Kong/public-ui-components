<template>
  <div
    v-if="showTooltip"
    ref="tooltipEl"
    class="tooltip-container"
    :class="{ 'locked': locked }"
    :style="{
      transform: locked ? `translate(${dragPosition.left}, ${dragPosition.top})` : `translate(${left}, ${top})`,
      left: '0',
      top: '0',
      pointerEvents: locked ? 'all' : 'none'
    }"
    @mousedown="handleMouseDown"
  >
    <div class="tooltip-title">
      <span class="title font-bold">{{ tooltipTitle }}</span>
      <DragIcon
        v-if="locked"
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
        v-for="{ backgroundColor, borderColor, label, value, isSegmentEmpty } in (series as any)"
        :key="label"
      >
        <li v-if="series.length">
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DragIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'

const emit = defineEmits(['dimensions', 'top', 'left'])

const props = defineProps({
  showTooltip: {
    type: Boolean,
    required: true,
    default: false,
  },
  /**
   * The left position relative to the chart
   * eg. '10px'
   */
  left: {
    type: String,
    required: false,
    default: null,
  },
  /**
   * The top position relative to the chart
   */
  top: {
    type: String,
    required: false,
    default: null,
  },
  /**
   * Tooltip title
   */
  tooltipTitle: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * X axes value under cursor
   */
  context: {
    type: [String, Number],
    required: false,
    default: '',
  },
  /**
   * Array of all dataset series labels and colors under cursor
   */
  series: {
    type: Array,
    required: true,
    default: () => [],
  },
  /**
   * Is the tooltip locked
   */
  locked: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const tooltipEl = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dragStartPosition = ref({ x: 0, y: 0 })
const dragMouseStartPosition = ref({ x: 0, y: 0 })
const dragPosition = ref({ left: props.left, top: props.top })

watch(tooltipEl, value => {
  if (value) {
    const { width, height } = value.getBoundingClientRect()

    emit('dimensions', { width, height })
  }
})

watch(() => props.locked, value => {
  if (value) {
    dragPosition.value.left = props.left
    dragPosition.value.top = props.top
  } else if (value === false) {
    emit('top', dragPosition.value.top)
    emit('left', dragPosition.value.left)
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
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: column;
    margin: var(--kui-space-30, $kui-space-30);
    min-height: 24px;
    padding-bottom: var(--kui-space-30, $kui-space-30);

    .title {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }

    .subtitle {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      margin-top: var(--kui-space-30, $kui-space-30);
    }

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
