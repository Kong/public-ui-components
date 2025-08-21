<template>
  <div
    ref="flowCanvas"
    class="dk-flow-canvas"
  >
    <VueFlow
      :id="flowId"
      class="flow"
      :class="{ readonly }"
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
      @dragover.prevent
      @drop="(e: DragEvent) => onDrop(e)"
      @node-click="onNodeClick"
      @nodes-initialized="emit('initialized')"
    >
      <Background />
      <Controls
        v-if="!readonly"
        :fit-view-params="fitViewParams"
        position="bottom-left"
        :show-interactive="false"
      >
        <button
          class="vue-flow__controls-button vue-flow__controls-interactive custom"
          @click="onClickAutoLayout"
        >
          <SparklesIcon :size="18" /> <!-- TODO: Replace with a better icon for "auto layout" -->
        </button>
      </Controls>

      <!-- To not use the default node style -->
      <template #node-flow="node">
        <FlowNode
          :data="node.data"
          :error="invalidConfigNodeIds.has(node.data.id)"
        />
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import type { DragPayload, NodeId, NodePhase } from '../../types'

import { SparklesIcon } from '@kong/icons'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import { useElementBounding } from '@vueuse/core'
import { nextTick, useTemplateRef } from 'vue'

import { DK_DATA_TRANSFER_MIME_TYPE } from '../../constants'
import { provideFlowStore } from '../composables/useFlow'
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from '../constants'
import FlowNode from '../node/FlowNode.vue'

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

const {
  vueFlowStore,
  editorStore,
  nodes,
  edges,
  autoLayout,
  fitViewParams,
  fitView,
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
const { addNode, selectNode: selectStoreNode, propertiesPanelOpen, newCreatedNodeId, invalidConfigNodeIds } = editorStore
const { project, vueFlowRef, addSelectedNodes, getNodes } = vueFlowStore

async function selectNode(nodeId?: NodeId) {
  selectStoreNode(nodeId)
  await nextTick()
  const selectedNode = getNodes.value.find((n) => n.id === nodeId)
  addSelectedNodes(selectedNode ? [selectedNode] : [])
}

function onNodeClick() {
  if (readonly) return
  propertiesPanelOpen.value = true
}

function onDrop(e: DragEvent) {
  if (readonly) return

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
  selectNode(nodeId)

  if (nodeId) {
    newCreatedNodeId.value = nodeId
    propertiesPanelOpen.value = true
  }
}

const onClickAutoLayout = () => {
  autoLayout()
  nextTick(() => fitView())
}

defineExpose({ autoLayout, fitView })
</script>

<style lang="scss" scoped>
.dk-flow-canvas {
  background-color: $kui-color-background-neutral-weakest;
  height: 100%;
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
</style>
