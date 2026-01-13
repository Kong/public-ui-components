<template>
  <div
    ref="paneItemRef"
    class="kong-ui-public-split-pane-item"
    :style="paneStyle"
  >
    <slot />
  </div>
  <slot name="divider">
    <div
      class="kong-ui-public-split-pane-item-divider"
      :class="{ 'is-dragging': isDragging, 'has-handle': showDividerHandle }"
      @mousedown="onMouseDown"
    >
      <slot
        v-if="showDividerHandle"
        name="divider-handle"
      >
        <div class="kong-ui-public-split-pane-item-divider-handle" />
      </slot>
    </div>
  </slot>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, getCurrentInstance, useTemplateRef } from 'vue'
import type { CSSProperties } from 'vue'
import { SplitPaneKey, type SplitPaneContext } from '../context/splitPaneContext'
import { useEventListener } from '@vueuse/core'


const {
  size,
  minSize = 0,
  maxSize = 100,
  showDividerHandle = true,
} = defineProps<{
  /**
   * Size of the pane in percentage (0-100)
   */
  size?: number | string
  /**
   * Minimum size of the pane in percentage (0-100)
   */
  minSize?: number | string
  /**
   * Maximum size of the pane in percentage (0-100)
   */
  maxSize?: number | string
  /**
   * Whether to show the divider handle
   */
  showDividerHandle?: boolean
}>()

const ctx = inject<SplitPaneContext>(SplitPaneKey)
const paneItemRef = useTemplateRef('paneItemRef')
// Use component instance UID as unique identifier for the pane
const uid = getCurrentInstance()?.uid ?? 0
const order = getCurrentInstance()!.vnode.key ?? uid

// Get the pane configuration from context using the uid
const pane = computed(() => ctx?.indexedPanes.value[uid])

const paneStyle = computed<CSSProperties>(() => ({
  [ctx?.horizontal ? 'height' : 'width']: `${pane.value?.size ?? 0}%`,
  flexShrink: 0,
  flexGrow: 0,
}))

const isDragging = ref(false)

const sizeNumber = computed(() => {
  const value = typeof size === 'string' ? parseFloat(size) : size
  if (value === undefined || isNaN(value as number)) return null
  return Math.max(Math.min(value as number, maxSizeNumber.value), minSizeNumber.value)
})

const minSizeNumber = computed(() => {
  const value = typeof minSize === 'string' ? parseFloat(minSize) : minSize
  return isNaN(value as number) ? 0 : (value as number)
})

const maxSizeNumber = computed(() => {
  const value = typeof maxSize === 'string' ? parseFloat(maxSize) : maxSize
  return isNaN(value as number) ? 100 : (value as number)
})

watch(sizeNumber, size => size != null && ctx?.updatePane(uid, { size }))
watch(minSizeNumber, min => ctx?.updatePane(uid, { min }))
watch(maxSizeNumber, max => ctx?.updatePane(uid, { max }))

/**
 * Handle mouse down event on the divider to initiate drag operation.
 * Sets up mouse move and mouse up listeners for the drag operation.
 */
const onMouseDown = (e: MouseEvent) => {
  e.preventDefault()

  if (!pane.value || !ctx) return

  isDragging.value = true

  ctx.startDrag(pane.value.index)

  // Track mouse movement during drag
  const onMouseMove = (moveEvent: MouseEvent) => {
    const currentPos = ctx.horizontal ? moveEvent.clientY : moveEvent.clientX
    ctx.drag(pane.value!.index, currentPos)
  }

  // Clean up and end drag on mouse up
  const onMouseUp = () => {
    isDragging.value = false
    ctx.endDrag()
    useEventListener('mousemove', onMouseMove)
    useEventListener('mouseup', onMouseUp)
  }

  useEventListener('mousemove', onMouseMove)
  useEventListener('mouseup', onMouseUp)
}

onMounted(async () => {
  ctx?.registerPane({
    id: uid,
    order: Number(order),
    el: paneItemRef.value,
    min: minSizeNumber.value,
    max: maxSizeNumber.value,
    size: sizeNumber.value ?? 0,
    givenSize: sizeNumber.value,
  })
})

onBeforeUnmount(() => ctx?.unregisterPane(uid))
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-item {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: auto;
  position: relative;
  transition: width 0.2s ease-out, height 0.2s ease-out;
  will-change: width, height;
}

.kong-ui-public-split-pane-item-divider {
  background-color: $kui-color-background-neutral-weaker;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.2s ease;
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
      transition: background 0.2s ease;
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
    background-color: $kui-color-background-primary;

    .split-pane-divider {
      &-handle {
        &::after,
        &::before {
          background: $kui-color-background-neutral-weak;
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
