<template>
  <div
    v-if="showTooltip"
    ref="tooltipEl"
    class="tooltip-container"
    :class="{ 'locked': locked }"
    :style="{ left: locked ? dragPosition.left : left, top: locked ? dragPosition.top : top, pointerEvents: locked ? 'all' : 'none' }"
    @mousedown="handleMouseDown"
  >
    <ul
      class="tooltip"
    >
      <li class="tooltip-title">
        <span class="title font-bold">{{ tooltipTitle }}</span>
        <span
          v-if="context"
          class="subtitle"
        >{{ context }}</span>
      </li>
      <template
        v-for="{ backgroundColor, borderColor, label, value } in (series as any)"
        :key="label"
      >
        <li v-if="series.length">
          <div
            class="tooltip-legend"
            :style="{ background: backgroundColor, 'border-color': borderColor }"
          />
          <span class="display-label">{{ label }}</span>
          <span class="display-value">{{ value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
    dragStartPosition.value = { x: tooltipEl.value.offsetLeft, y: tooltipEl.value.offsetTop }
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
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

</script>

<style lang="scss" scoped>
@import '../../styles/base';

.locked {
  cursor: pointer;
}
.tooltip-container {
  background-color: $color-white;
  border-radius: 3px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.24);
  max-width: 425px;
  min-width: 250px;
  overflow-y: scroll;
  position: absolute;
  scrollbar-width: thin;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 999;

  &::-webkit-scrollbar-track {
    background-color: var(--white, #FFFFFF);
    border-radius: 10px;
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--grey-300, #E7E7EC);
    border-radius: 10px;
  }
}

ul.tooltip {
  list-style: none;
  margin: 0px;
  max-height: 300px;
  min-width: 250px;
  padding-left: 0px;

  li {
    display: flex;
    font-size: $font-size-sm;
    margin: $spacing-8;
  }

  li:first-child {
    border-bottom: 1px solid $color-black-10;
  }

  .tooltip-title {
    display: flex;
    flex-direction: column;
    padding-bottom: $spacing-xxs;

    .title {
      font-size: $font-size-md;
      font-weight: bold;
    }
    .subtitle {
      font-size: $font-size-sm;
      margin-top: $spacing-8;
    }
  }

  .display-label {
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-value {
    margin-left: auto;
    padding-left: $spacing-8;
    white-space: nowrap;
  }

  .tooltip-legend {
    display: inline-flex;
    flex-direction: row;
    height: 15px;
    margin-right: 8px;
    width: 3px;
  }
}
</style>
