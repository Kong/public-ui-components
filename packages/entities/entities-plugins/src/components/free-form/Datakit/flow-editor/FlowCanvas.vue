<template>
  <div
    ref="flowCanvas"
    class="dk-flow-canvas"
  >
    <VueFlow
      :id="flowId"
      class="flow"
      :class="{ readonly }"
      :connect-on-click="false"
      :edges="edges"
      :elements-selectable="!readonly"
      :max-zoom="MAX_ZOOM_LEVEL"
      :min-zoom="MIN_ZOOM_LEVEL"
      :multi-selection-key-code="null"
      :nodes="nodes"
      :nodes-connectable="!readonly"
      :nodes-draggable="!readonly"
      :pan-on-drag="readonly ? false : undefined"
      :pan-on-scroll="readonly ? false : undefined"
      :zoom-on-double-click="readonly ? false : undefined"
      :zoom-on-pinch="readonly ? false : undefined"
      :zoom-on-scroll="readonly ? false : undefined"
      @dragover="onDragOver"
      @drop="onDrop"
      @node-click="onNodeClick"
      @nodes-initialized="emit('initialized')"
    >
      <Background />
      <Controls
        v-if="!readonly"
        :fit-view-params="fitViewParams"
        position="bottom-left"
        :show-fit-view="false"
        :show-interactive="false"
        :show-zoom="false"
      >
        <KTooltip
          v-for="control in controls"
          :key="control.name"
          placement="right"
          :text="t(`plugins.free-form.datakit.flow_editor.actions.${control.name}`)"
        >
          <ControlButton
            class="custom"
            :disabled="control.disabled"
            @click.stop="control.action"
          >
            <component
              :is="control.icon"
              :size="18"
            />
          </ControlButton>
        </KTooltip>
      </Controls>

      <!-- To not use the default node style -->
      <template #node-flow="node">
        <FlowNode
          :data="node.data"
          :error="invalidConfigNodeIds.has(node.data.id)"
        />
      </template>
    </VueFlow>

    <div
      v-if="disableDrop"
      class="dk-flow-mask"
    >
      {{ t('plugins.free-form.datakit.flow_editor.phase_mask_help') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { DragPayload, NodePhase } from '../types'

import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useElementBounding, useEventListener, useTimeoutFn } from '@vueuse/core'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { KTooltip } from '@kong/kongponents'
import { AddIcon, RemoveIcon, AutoLayoutIcon } from '@kong/icons'

import useI18n from '../../../../composables/useI18n'
import { DK_DATA_TRANSFER_MIME_TYPE } from '../constants'
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from './constants'
import FlowNode from './node/FlowNode.vue'
import { provideFlowStore } from './store/flow'
import { useHotkeys } from './composables/useHotkeys'
import FitIcon from './icons/FitIcon.vue'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { flowId, phase, readonly } = defineProps<{
  flowId: string
  phase: NodePhase
  readonly?: boolean
}>()

const emit = defineEmits<{
  initialized: []
}>()

const flowCanvas = useTemplateRef('flowCanvas')
const flowCanvasRect = useElementBounding(flowCanvas)
const { i18n: { t } } = useI18n()

const {
  vueFlowStore,
  editorStore,
  nodes,
  edges,
  autoLayout,
  fitViewParams,
  fitView,
  selectNode,
  placeToRight,
  scrollRightToReveal,
} = provideFlowStore({
  phase,
  flowId,
  layoutOptions: {
    viewport: {
      width: flowCanvasRect.width,
      height: flowCanvasRect.height,
    },
  },
  readonly,
})
const { addNode, propertiesPanelOpen, invalidConfigNodeIds, selectedNode, duplicateNode } = editorStore
const { project, vueFlowRef, zoomIn, zoomOut, viewport, maxZoom, minZoom } = vueFlowStore

const disableDrop = ref(false)

function onNodeClick() {
  if (readonly) return
  propertiesPanelOpen.value = true
}

function onDragOver(e: DragEvent) {
  if (readonly || disableDrop.value) return

  e.preventDefault()
}

function onDrop(e: DragEvent) {
  if (readonly || disableDrop.value) return

  const data = e.dataTransfer?.getData(DK_DATA_TRANSFER_MIME_TYPE)
  if (!data) return

  e.preventDefault()

  const payload = JSON.parse(data) as DragPayload
  if (payload.action !== 'create-node') return

  // VueFlow has a bug where it fails to take the top/left offset of the flow canvas into account
  // when projecting the coordinates from mouse event to viewport coordinates.
  const { top = 0, left = 0 } = vueFlowRef.value?.getBoundingClientRect() || {}

  const projected = project({
    x: e.clientX - left,
    y: e.clientY - top,
  })

  const { type, anchor } = payload.data
  const newNode = {
    type,
    phase,
    position: {
      x: projected.x - anchor.offsetX,
      y: projected.y - anchor.offsetY,
    },
  }

  const nodeId = addNode(newNode)

  if (!nodeId) return

  selectNode(nodeId)
  propertiesPanelOpen.value = true
}

function onClickAutoLayout() {
  autoLayout()
  nextTick(() => fitView())
}

type ControlAction = 'zoom_in' | 'zoom_out' | 'fit_view' | 'auto_layout'
type Control = {
  name: ControlAction
  icon: Component
  action: () => void
  disabled?: boolean
}

const controls = computed<Control[]>(() => [
  { name: 'zoom_in', icon: AddIcon, action: zoomIn, disabled: viewport.value.zoom >= maxZoom.value },
  { name: 'zoom_out', icon: RemoveIcon, action: zoomOut, disabled: viewport.value.zoom <= minZoom.value },
  { name: 'fit_view', icon: FitIcon, action: fitView },
  { name: 'auto_layout', icon: AutoLayoutIcon, action: onClickAutoLayout },
])

// Check if the dragged node is valid to drop
if (phase === 'response' && !readonly) {
  useEventListener('dragstart', (e: DragEvent) => {
    const format = e.dataTransfer?.types.find(type => type.startsWith(`${DK_DATA_TRANSFER_MIME_TYPE}/`))
    if (!format) return

    const nodeType = format.replace(`${DK_DATA_TRANSFER_MIME_TYPE}/`, '')
    if ((nodeType === 'call')) {
      disableDrop.value = true
    }
  })

  // `dragend` fires only after the long snap-back animation, so UI feels delayed.
  // Instead rely on `dragover`: it fires repeatedly at high frequency while dragging.
  // Restart a short timer on every `dragover`. If no event comes within ~80ms,
  // assume the user released and reset `disableDrop` immediately.
  const { start } = useTimeoutFn(() => {
    disableDrop.value = false
  }, 80)

  useEventListener('dragover', () => {
    start()
  })

  useEventListener('dragend', () => {
    disableDrop.value = false
  })
}

async function duplicate() {
  const node = selectedNode.value
  if (readonly || !node || node.phase !== phase) return

  const nodeId = duplicateNode(node.id, placeToRight(node.id))

  if (!nodeId) return

  await selectNode(nodeId)
  propertiesPanelOpen.value = true
  scrollRightToReveal(nodeId)
}

useHotkeys({
  enabled: computed(() => !!selectedNode.value && !readonly && selectedNode.value.phase === phase),
  duplicate,
})

defineExpose({ autoLayout, fitView })
</script>

<style lang="scss" scoped>
.dk-flow-canvas {
  background-color: $kui-color-background-neutral-weakest;
  height: 100%;
  position: relative;
  width: 100%;

  .flow {
    :deep(.vue-flow__controls-button) {
      // Ensure it works in both the sandbox and host apps
      box-sizing: content-box;

      // TODO(Makito): Maybe remove this as soon as we find a better icon
      &.custom {
        svg {
          max-height: unset;
          max-width: unset;
        }
      }
    }

    &:not(.readonly) {
      :deep(.vue-flow__node) {
        &:hover .flow-node {
          border-color: $kui-color-border-primary-weak;
        }

        &.selected .flow-node {
          border-color: $kui-color-border-primary;
        }
      }
    }

    &.readonly * {
      cursor: default;
    }

    :deep(.vue-flow__edge) {
      .vue-flow__edge-path {
        stroke-dasharray: 5;
      }
    }

    :deep(.vue-flow__connection) {
      stroke-dasharray: 5;
    }
  }
}

.dk-flow-mask {
  align-items: center;
  background: rgba($color: $kui-color-background, $alpha: 0.75);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}
</style>
