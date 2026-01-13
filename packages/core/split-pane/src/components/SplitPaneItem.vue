<template>
  <div
    ref="paneItemRef"
    class="kong-ui-public-split-pane-item"
    :style="paneStyle"
  >
    <slot />
  </div>
  <div
    class="kong-ui-public-split-pane-item-divider"
    :class="{ 'is-dragging': isDragging, 'has-handle': showDividerHandle }"
    @mousedown="onMouseDown"
  >
    <div
      v-if="showDividerHandle"
      class="kong-ui-public-split-pane-item-divider-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, useTemplateRef } from 'vue'
import type { CSSProperties } from 'vue'
import { SplitPaneKey, type SplitPaneContext } from '../context/splitPaneContext'
import { useEventListener } from '@vueuse/core'


const {
  size,
  minSize = 0,
  maxSize = 100,
  showDividerHandle = false,
} = defineProps<{
  /**
   * Size of the pane in percentage (0-100)
   * @default undefined
   */
  size?: number | string
  /**
   * Minimum size of the pane in percentage (0-100)
   * @default 0
   */
  minSize?: number | string
  /**
   * Maximum size of the pane in percentage (0-100)
   * @default 100
   */
  maxSize?: number | string
  /**
   * Whether to show the divider handle
   * @default false
   */
  showDividerHandle?: boolean
}>()

// Inject the split pane context provided by the parent SplitPane component
const splitPaneContext = inject<SplitPaneContext>(SplitPaneKey)

// Template ref to the pane DOM element
const paneItemRef = useTemplateRef('paneItemRef')

/**
 * Generate a unique identifier (UID) for this pane
 * Used to register and manage this pane within the SplitPane context
 */
const uid: number = crypto.randomUUID().split('-').reduce((acc, part) => acc + parseInt(part, 16), 0)

/**
 * Get the pane configuration from context using the UID
 * This computed property provides access to this pane's state managed by the parent
 */
const pane = computed(() => splitPaneContext?.indexedPanes.value[uid])

/**
 * Computed style object for the pane element
 * Dynamically sets width or height based on the split direction and current size
 */
const paneStyle = computed<CSSProperties>(() => ({
  [splitPaneContext?.horizontal ? 'height' : 'width']: `${pane.value?.size ?? 0}%`,
  flexShrink: 0,
  flexGrow: 0,
}))

/**
 * Local dragging state for this specific pane's divider
 * Used to apply visual feedback during drag operations
 */
const isDragging = ref(false)

/**
 * Computed property that converts the size prop to a number and clamps it
 * Returns null if size is not provided or invalid
 * Automatically respects min/max constraints
 */
const sizeNumber = computed(() => {
  const value = typeof size === 'string' ? parseFloat(size) : size
  if (value === undefined || isNaN(value as number)) return null
  return Math.max(Math.min(value as number, maxSizeNumber.value), minSizeNumber.value)
})

/**
 * Computed property that converts the minSize prop to a number
 * Defaults to 0 if not provided or invalid
 */
const minSizeNumber = computed(() => {
  const value = typeof minSize === 'string' ? parseFloat(minSize) : minSize
  return isNaN(value as number) ? 0 : (value as number)
})

/**
 * Computed property that converts the maxSize prop to a number
 * Defaults to 100 if not provided or invalid
 */
const maxSizeNumber = computed(() => {
  const value = typeof maxSize === 'string' ? parseFloat(maxSize) : maxSize
  return isNaN(value as number) ? 100 : (value as number)
})

/**
 * Watch for changes to the size prop and update the pane configuration in context
 * Only updates if the size is a valid number
 */
watch(sizeNumber, size => size != null && splitPaneContext?.updatePane(uid, { size }))

/**
 * Watch for changes to the minSize prop and update the pane configuration in context
 */
watch(minSizeNumber, min => splitPaneContext?.updatePane(uid, { min }))

/**
 * Watch for changes to the maxSize prop and update the pane configuration in context
 */
watch(maxSizeNumber, max => splitPaneContext?.updatePane(uid, { max }))

/**
 * Handle mouse down event on the divider to initiate drag operation.
 * Sets up mouse move and mouse up listeners for the drag operation.
 *
 * @param e - The mouse down event from the divider element
 */
const onMouseDown = (e: MouseEvent) => {
  // Prevent default behavior (text selection, etc.)
  e.preventDefault()

  // Early return if pane is not registered or context is missing
  if (!pane.value || !splitPaneContext) return

  // Set local dragging state for visual feedback
  isDragging.value = true

  // Notify parent context to start the drag operation
  splitPaneContext.startDrag(pane.value.index)

  /**
   * Track mouse movement during drag
   * Updates pane sizes based on cursor position
   */
  const onMouseMove = (moveEvent: MouseEvent) => {
    // Get the current mouse position based on split direction
    // Use clientY for horizontal splits (top/bottom), clientX for vertical splits (left/right)
    const currentPos = splitPaneContext.horizontal ? moveEvent.clientY : moveEvent.clientX
    splitPaneContext.drag(pane.value!.index, currentPos)
  }

  /**
   * Clean up and end drag on mouse up
   * Removes event listeners and resets dragging state
   */
  const onMouseUp = () => {
    isDragging.value = false
    splitPaneContext.endDrag()
    // useEventListener returns cleanup functions that automatically remove listeners
    useEventListener('mousemove', onMouseMove)
    useEventListener('mouseup', onMouseUp)
  }

  // Attach event listeners for the drag operation
  // These will be automatically cleaned up when the handlers are invoked
  useEventListener('mousemove', onMouseMove)
  useEventListener('mouseup', onMouseUp)
}

/**
 * Register this pane with the parent SplitPane context on mount
 * Provides all necessary configuration including size constraints and DOM reference
 */
onMounted(async () => {
  splitPaneContext?.registerPane({
    id: uid,
    el: paneItemRef.value,
    min: minSizeNumber.value,
    max: maxSizeNumber.value,
    size: sizeNumber.value ?? 0,
    givenSize: sizeNumber.value,
  })
})

/**
 * Unregister this pane from the parent context before unmounting
 * Ensures proper cleanup and prevents memory leaks
 */
onBeforeUnmount(() => splitPaneContext?.unregisterPane(uid))
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-item {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: auto;
  position: relative;
  transition: width, height var(--kui-animation-duration-20, $kui-animation-duration-20) ease-out,
    height var(--kui-animation-duration-20, $kui-animation-duration-20) ease-out;
  will-change: width, height;
}

.kong-ui-public-split-pane-item-divider {
  background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
  flex-shrink: 0;
  position: relative;
  transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
  user-select: none;
  z-index: 1;

  &.has-handle {
    // hidden clickable area for easier dragging
    &::before {
      background: transparent;
      content: '';
      height: 30px; // same size as the handle
      left: 0%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      z-index: 2;
    }
  }

  &-handle {
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);

    &::before,
    &::after {
      background: $kui-color-background-neutral-weaker;
      content: '';
      display: block;
      height: 30px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      transition: background var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
      width: 1px;
    }

    &::before {
      left: 3px;
    }

    &::after {
      left: 6px;
    }
  }

  &:hover,
  &.is-dragging {
    background-color: var(--kui-color-background-primary, $kui-color-background-primary);

    .split-pane-divider {
      &-handle {
        &::after,
        &::before {
          background: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
        }
      }
    }
  }
}

.kong-ui-public-split-pane-content-panes {
  &.horizontal {
    .kong-ui-public-split-pane-item-divider {
      cursor: col-resize;
      height: 100%;
      width: 1px;
    }
  }

  &.vertical {
    .kong-ui-public-split-pane-item-divider {
      cursor: row-resize;
      height: 1px;
      width: 100%;

      &::before {
        height: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
      }

      &-handle {
        transform: rotate(90deg);
      }
    }
  }

  &.dragging {
    .kong-ui-public-split-pane-item {
      pointer-events: none;
      transition: none;
      user-select: none;
    }
  }
}
</style>
