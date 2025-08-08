<template>
  <div
    ref="flow-wrapper"
    class="flow-wrapper"
  >
    <VueFlow
      :id="flowId"
      class="flow"
      :edges="edges"
      fit-view-on-init
      :nodes="nodes"
      @click.capture="onMaybeBackdropClick"
      @dragover.prevent
      @drop="(e: DragEvent) => onDrop(e)"
      @node-click="onNodeClick"
      @nodes-initialized="onNodesInitializes"
    >
      <Background />
      <Controls position="bottom-left">
        <button
          class="vue-flow__controls-button vue-flow__controls-interactive custom"
          @click="handleAutoLayout"
        >
          <SparklesIcon :size="18" /> <!-- TODO: Replace with a better icon for "auto layout" -->
        </button>
      </Controls>

      <!-- To not use the default node style -->
      <template #node-flow="node">
        <FlowNode :data="node.data" />
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import type { DragPayload, NodeInstance, NodePhase } from '../../types'

import { SparklesIcon } from '@kong/icons'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow, type NodeMouseEvent } from '@vue-flow/core'
import { ref, useId, useTemplateRef } from 'vue'

import { DK_DATA_TRANSFER_MIME_TYPE } from '../../constants'
import useFlow from '../composables/useFlow'
import FlowNode from '../node/FlowNode.vue'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const props = defineProps<{
  phase: NodePhase
}>()

const flowWrapper = useTemplateRef('flow-wrapper')
const initialLayoutTriggered = ref(false)

const uniqueId = useId()
const flowId = `${uniqueId}-${props.phase}`

const { vueFlowStore, editorStore, nodes, edges, autoLayout } = useFlow(props.phase, flowId)
const { addNode } = editorStore
const { project, vueFlowRef } = vueFlowStore

const emit = defineEmits<{
  'click:node': [node: NodeInstance]
  'click:backdrop': []
}>()

const onDrop = (e: DragEvent) => {
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
    phase: props.phase,
    position: {
      x: projected.x - anchor.offsetX,
      y: projected.y - anchor.offsetY,
    },
  }

  addNode(newNode)
}

function onNodeClick({ event, node }: NodeMouseEvent) {
  event.stopPropagation()
  emit('click:node', node.data)
}

function onMaybeBackdropClick(event: MouseEvent) {
  if (event.target instanceof Element) {
    // Ignore clicks on controls
    if (event.target.closest('.vue-flow__controls')) {
      return
    }
  }
  emit('click:backdrop')
}

function onNodesInitializes() {
  if (!initialLayoutTriggered.value) {
    initialLayoutTriggered.value = true
    handleAutoLayout()
  }

  // Reserved for future steps
}

function handleAutoLayout() {
  autoLayout({
    boundingRect: flowWrapper.value!.getBoundingClientRect(),
  })
}
</script>

<style lang="scss" scoped>
.flow-wrapper {
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

    :deep(.vue-flow__node) {
      &:hover .flow-node {
        border-color: $kui-color-border-primary-weak;
      }

      &.selected .flow-node {
        border-color: $kui-color-border-primary;
      }
    }


    :deep(.vue-flow__edge) {
      .vue-flow__edge-path {
        stroke-dasharray: 5;
      }

      // TODO(Makito): Make markers have the same color as paths
      // &:hover .vue-flow__edge-path {
      //   marker: $kui-color-border-primary-weak;
      //   stroke: $kui-color-border-primary-weak;
      // }

      // &.selected .vue-flow__edge-path {
      //   marker: $kui-color-border-primary;
      //   stroke: $kui-color-border-primary;
      // }
    }

    :deep(.vue-flow__connection) {
      stroke-dasharray: 5;
    }
  }
}

</style>
