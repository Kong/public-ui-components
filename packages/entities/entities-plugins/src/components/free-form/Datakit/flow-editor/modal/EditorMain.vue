<template>
  <div class="dk-editor-main">
    <header class="header">
      <div class="actions">
        <KButton
          appearance="tertiary"
          target="_blank"
          to="https://developer.konghq.com/plugins/datakit/"
        >
          {{ t('plugins.free-form.datakit.flow_editor.view_docs') }}
          <ExternalLinkIcon />
        </KButton>
        <KButton>
          {{ t('plugins.free-form.datakit.flow_editor.save') }}
        </KButton>
      </div>
    </header>

    <div
      ref="canvasContainer"
      class="body"
    >
      <EditorCanvas>
        <template #request>
          <VueFlow
            :id="requestId"
            class="flow"
            fit-view-on-init
            :nodes="requestNodes"
            @click.capture="onMaybeBackdropClick"
            @dragover.prevent
            @drop="(e: DragEvent) => onDrop(e, 'request')"
            @node-click="onNodeClick"
            @node-drag-stop="onNodeDragStop"
            @nodes-change="onNodesChange"
          >
            <Background />
            <Controls position="bottom-left" />

            <!-- To not use the default node style -->
            <template #node-flow="node">
              <FlowNode :data="node.data" />
            </template>
          </VueFlow>
        </template>

        <template #response>
          <VueFlow
            :id="responseId"
            class="flow"
            fit-view-on-init
            :nodes="responseNodes"
            @click.capture="onMaybeBackdropClick"
            @dragover.prevent
            @drop="(e: DragEvent) => onDrop(e, 'response')"
            @node-click="onNodeClick"
            @node-drag-stop="onNodeDragStop"
            @nodes-change="onNodesChange"
          >
            <Background />
            <Controls position="bottom-left" />

            <!-- To not use the default node style -->
            <template #node-flow="node">
              <FlowNode :data="node.data" />
            </template>
          </VueFlow>
        </template>
      </EditorCanvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ExternalLinkIcon } from '@kong/icons'
import { KButton } from '@kong/kongponents'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useVueFlow, VueFlow } from '@vue-flow/core'

import english from '../../../../../locales/en.json'
import FlowNode from '../node/FlowNode.vue'
import { useEditorStore } from '../../composables'
import { DK_DATA_TRANSFER_MIME_TYPE } from '../../constants'
import { useId } from 'vue'

import EditorCanvas from './EditorCanvas.vue'

import type { NodeChange, NodeMouseEvent } from '@vue-flow/core'
import type { DragPayload, NodeId, NodeInstance, NodePhase } from '../../types'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { t } = createI18n<typeof english>('en-us', english)

defineSlots<{
  default(): any
}>()

const emit = defineEmits<{
  'click:node': [node: NodeInstance]
  'click:backdrop': []
}>()

const { requestNodes, responseNodes, addNode, moveNode, removeNode } = useEditorStore()

const onMaybeBackdropClick = (event: MouseEvent) => {
  if (event.target instanceof Element) {
    // Ignore clicks on controls
    if (event.target.closest('.vue-flow__controls')) {
      return
    }
  }
  emit('click:backdrop')
}

const onNodeClick = ({ event, node }: NodeMouseEvent) => {
  event.stopPropagation()
  emit('click:node', node.data)
}

const uniqueId = useId()
const requestId = `${uniqueId}-request`
const responseId = `${uniqueId}-response`

const { project: requestProject, vueFlowRef: requestRef } =
  useVueFlow(requestId)
const { project: responseProject, vueFlowRef: responseRef } =
  useVueFlow(responseId)

const onDrop = (e: DragEvent, phase: NodePhase) => {
  const data = e.dataTransfer?.getData(DK_DATA_TRANSFER_MIME_TYPE)
  if (!data) return

  e.preventDefault()

  const payload = JSON.parse(data) as DragPayload
  if (payload.action !== 'create-node') return

  const project = phase === 'request' ? requestProject : responseProject
  // VueFlow has a bug where it fails to take the top/left offset of the flow canvas into account
  // when projecting the coordinates from mouse event to viewport coordinates.
  const vueFlowRef = phase === 'request' ? requestRef : responseRef
  const { top = 0, left = 0 } = vueFlowRef.value?.getBoundingClientRect() || {}

  const newNode = {
    type: payload.data.type,
    phase,
    position: project({ x: e.clientX - left, y: e.clientY - top }),
  }

  addNode(newNode)
}

const onNodeDragStop = (event: NodeMouseEvent) => {
  const { node } = event
  if (!node) return

  // Update the node position in the store
  moveNode(node.id as NodeId, node.position)
}

const onNodesChange = (changes: NodeChange[]) => {
  changes.forEach((change) => {
    if (change.type === 'remove') {
      removeNode(change.id as NodeId)
    }
  })
}
</script>

<style lang="scss" scoped>
.dk-editor-main {
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    align-items: center;
    border-bottom: 1px solid $kui-color-border;
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    justify-content: flex-end;
    padding: 0px $kui-space-30 0px $kui-space-50;
  }

  .actions {
    display: flex;
    gap: $kui-space-30;
  }

  .body {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .flow {
    :deep(.vue-flow__controls-button) {
      // Ensure it works in both the sandbox and host apps
      box-sizing: content-box;
    }
  }
}
</style>
