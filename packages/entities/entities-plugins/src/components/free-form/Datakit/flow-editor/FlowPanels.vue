<template>
  <div
    ref="flowPanels"
    class="flow-panels"
  >
    <div
      ref="requestLabel"
      class="label request"
      @click="onRequestLabelClick"
    >
      <ChevronDownIcon
        class="icon"
        :class="{ collapsed: isRequestCollapsed }"
      />
      <div>Request</div>
    </div>

    <div
      ref="requestCanvasContainer"
      class="canvas"
      :class="{ dragging: isDragging }"
      :style="{ flexBasis: requestHeight }"
    >
      <FlowCanvas
        :editing="editing"
        phase="request"
      />
    </div>

    <div
      ref="resizeHandle"
      class="resize-handle"
    />

    <div
      ref="responseLabel"
      class="label response"
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
      ref="responseCanvasContainer"
      class="canvas response"
      :class="{ dragging: isDragging }"
      :style="{ flexBasis: responseHeight }"
    >
      <FlowCanvas
        :editing="editing"
        phase="response"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@kong/icons'
import { useDraggable, useElementBounding } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import FlowCanvas from './FlowCanvas.vue'

defineProps<{
  editing?: boolean
}>()

const flowPanels = useTemplateRef('flowPanels')
const requestLabel = useTemplateRef('requestLabel')
const requestCanvasContainer = useTemplateRef('requestCanvasContainer')
const resizeHandle = useTemplateRef('resizeHandle')
const responseLabel = useTemplateRef('responseLabel')
const responseCanvasContainer = useTemplateRef('responseCanvasContainer')

const flowPanelsRect = useElementBounding(flowPanels)
const requestLabelRect = useElementBounding(requestLabel)
const requestCanvasContainerRect = useElementBounding(requestCanvasContainer)
const resizeHandleRect = useElementBounding(resizeHandle)
const responseLabelRect = useElementBounding(responseLabel)
const responseCanvasContainerRect = useElementBounding(responseCanvasContainer)

const snappingHeight = computed(() => Math.max(30, flowPanelsRect.height.value * 0.03))
const isRequestCollapsed = computed(() => requestCanvasContainerRect.height.value < snappingHeight.value)
const isResponseCollapsed = computed(() => responseCanvasContainerRect.height.value < snappingHeight.value)

const requestHeight = ref('50%')
const responseHeight = ref('50%')

const onRequestLabelClick = () => {
  if (isRequestCollapsed.value) {
    requestHeight.value = '50%'
    responseHeight.value = '50%'
  } else {
    requestHeight.value = '0'
    responseHeight.value = '100%'
  }
}

const onResponseLabelClick = () => {
  if (isResponseCollapsed.value) {
    requestHeight.value = '50%'
    responseHeight.value = '50%'
  } else {
    requestHeight.value = '100%'
    responseHeight.value = '0'
  }
}

const requestResizableHeight = computed(() =>
  flowPanelsRect.height.value - requestLabelRect.height.value - resizeHandleRect.height.value - responseLabelRect.height.value,
)

const { isDragging } = useDraggable(resizeHandle, {
  onMove(position) {
    const handleCenterToRequestCanvasTop = Math.max(0, position.y - requestCanvasContainerRect.top.value)
    const requestProportion = Math.min(1,
      Math.max(0,
        handleCenterToRequestCanvasTop / requestResizableHeight.value,
      ),
    )
    requestHeight.value = `${requestProportion * 100}%`
    responseHeight.value = `${(1 - requestProportion) * 100}%`
  },
  onEnd() {
    if (requestCanvasContainerRect.height.value < snappingHeight.value) {
      requestHeight.value = '0'
      responseHeight.value = '100%'
    } else if (responseCanvasContainerRect.height.value < snappingHeight.value) {
      requestHeight.value = '100%'
      responseHeight.value = '0'
    }
  },
})
</script>

<style lang="scss" scoped>
@use 'sass:math';

.flow-panels {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .label {
    align-items: center;
    background-color: $kui-color-background;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    font-weight: $kui-font-weight-semibold;
    gap: $kui-space-20;
    justify-content: flex-start;
    padding: $kui-space-20 $kui-space-40;
    position: relative;
    width: 100%;

    .icon {
      transition: transform 150ms ease-out;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }

    &.request {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
    }

    &.response:before {
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: $kui-color-border;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      bottom: -$kui-border-width-10;
      content: '';
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      height: $kui-border-width-10;
      left: 0;
      position: absolute;
      width: 100%;
    }
  }

  .canvas {
    flex-basis: 50%;
    width: 100%;

    &:not(.dragging) {
      transition: all $kui-animation-duration-20 ease-out;
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
      z-index: 90;
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
      z-index: 100;
    }

    &:hover:after {
      transform: scaleY(1);
    }
  }
}
</style>
