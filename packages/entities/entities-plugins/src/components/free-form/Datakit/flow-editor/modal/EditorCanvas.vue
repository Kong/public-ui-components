<template>
  <div
    ref="editorCanvas"
    class="editor-canvas"
  >
    <div
      ref="requestLabel"
      class="label"
      @click="onRequestLabelClick"
    >
      <ChevronDownIcon
        class="icon"
        :class="{ collapsed: isRequestCollapsed }"
      />
      <div>Request</div>
    </div>

    <div
      ref="requestCanvas"
      class="canvas"
      :class="{ dragging: isDragging }"
      :style="{ height: requestHeight }"
    >
      <slot name="request" />
    </div>

    <div
      ref="resizeHandle"
      class="resize-handle"
    />

    <div
      ref="responseLabel"
      class="label"
      :class="{ dragging: isDragging }"
      @click="onResponseLabelClick"
    >
      <ChevronDownIcon
        class="icon"
        :class="{ collapsed: isResponseCollapsed }"
      />
      <div>Response</div>
    </div>

    <div
      ref="responseCanvas"
      class="canvas response"
    >
      <slot name="response" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@kong/icons'
import { useDraggable, useElementBounding } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

const editorCanvas = useTemplateRef('editorCanvas')
const requestLabel = useTemplateRef('requestLabel')
const requestCanvas = useTemplateRef('requestCanvas')
const resizeHandle = useTemplateRef('resizeHandle')
const responseCanvas = useTemplateRef('responseCanvas')

const editorCanvasRect = useElementBounding(editorCanvas)
const requestLabelRect = useElementBounding(requestLabel)
const requestCanvasRect = useElementBounding(requestCanvas)
const resizeHandleRect = useElementBounding(resizeHandle)
const responseCanvasRect = useElementBounding(responseCanvas)

const snappingHeight = computed(() => Math.max(30, editorCanvasRect.height.value * 0.03))
const isRequestCollapsed = computed(() => requestCanvasRect.height.value < snappingHeight.value)
const isResponseCollapsed = computed(() => responseCanvasRect.height.value < snappingHeight.value)

const requestHeight = ref('50%')

const onRequestLabelClick = () => {
  if (isRequestCollapsed.value) {
    requestHeight.value = '50%'
  } else {
    requestHeight.value = '0'
  }
}

const onResponseLabelClick = () => {
  if (isResponseCollapsed.value) {
    requestHeight.value = '50%'
  } else {
    requestHeight.value = '100%'
  }
}

const { isDragging } = useDraggable(resizeHandle, {
  onMove(position) {
    const handleCenterToTop = position.y + resizeHandleRect.height.value / 2
    const toTop = handleCenterToTop - requestLabelRect.bottom.value
    requestHeight.value = `max(0%, min(100%, ${toTop}px))`
  },
  onEnd() {
    if (requestCanvasRect.height.value < snappingHeight.value) {
      requestHeight.value = '0'
    } else if (responseCanvasRect.height.value < snappingHeight.value) {
      requestHeight.value = '100%'
    }
  },
})
</script>

<style lang="scss" scoped>
@use 'sass:math';

.editor-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .label {
    align-items: center;
    background-color: $kui-color-background;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    font-weight: $kui-font-weight-semibold;
    gap: $kui-space-20;
    justify-content: flex-start;
    padding: $kui-space-20 $kui-space-40;
    width: 100%;

    .icon {
      transition: transform 150ms ease-out;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }
  }

  .canvas {
    width: 100%;

    &:not(.dragging) {
      transition: height $kui-animation-duration-20 ease-out;
    }

    &.response {
      flex-basis: 0;
      flex-grow: 1;
    }
  }

  .resize-handle {
    $interactive-height: 5px;
    $visual-height: 1px;
    cursor: row-resize;
    flex-shrink: 0;
    height: $interactive-height;
    margin-bottom: math.div(-($interactive-height - $visual-height), 2);
    margin-top: math.div(-($interactive-height - $visual-height), 2);
    position: relative;
    user-select: none;
    width: 100%;

    &:before {
      $height: 1px;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: $kui-color-border;
      content: '';
      display: block;
      height: $height;
      left: 0;
      position: absolute;
      top: calc(50% - math.div($height, 2));
      width: 100%;
    }

    &:after {
      $height: 5px;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: $kui-color-border;
      content: '';
      display: block;
      height: $height;
      left: 0;
      position: absolute;
      top: calc(50% - math.div($height, 2));
      transform: scaleY(0);
      transition: transform $kui-animation-duration-20 ease-out;
      width: 100%;
    }

    &:hover:after {
      transform: scaleY(1);
    }
  }
}
</style>
