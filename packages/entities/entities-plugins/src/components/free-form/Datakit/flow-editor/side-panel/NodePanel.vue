<template>
  <div class="dk-node-panel">
    <h3
      v-if="!hideTitle"
      class="title"
    >
      <KLabel
        class="label"
        :info="
          t('plugins.free-form.datakit.flow_editor.node_panel.description')
        "
      >
        {{ t('plugins.free-form.datakit.flow_editor.node_panel.title') }}
      </KLabel>
    </h3>
    <div class="node-list">
      <NodePanelItem
        v-for="nodeType in (Object.keys(CONFIG_NODE_META_MAP) as Array<ConfigNodeType>)"
        :key="nodeType"
        :type="nodeType"
        @dragstart="handleDragStart"
      />
    </div>
    <div
      aria-hidden="true"
      class="preview"
      inert
    >
      <VueFlow :nodes="previewNodes">
        <template #node-flow="node">
          <FlowNode
            :id="previewId"
            :data="node.data"
          />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, useId } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { DK_DATA_TRANSFER_MIME_TYPE } from '../../constants'
import { useEditorStore } from '../store/store'
import { CONFIG_NODE_META_MAP } from '../node/node'
import NodePanelItem from '../node/NodePanelItem.vue'
import FlowNode from '../node/FlowNode.vue'

import type { ConfigNodeType, NodeInstance, DragPayload } from '../../types'

defineProps<{
  hideTitle?: boolean
}>()

const { t } = createI18n<typeof english>('en-us', english)

const { createNode } = useEditorStore()

const previewId = `dk-drag-preview-${useId()}`

const previewNode = shallowRef<NodeInstance>()
const previewNodes = computed(() => {
  if (!previewNode.value) {
    return []
  }
  return [
    {
      id: 'preview',
      type: 'flow',
      data: previewNode.value,
      position: { x: 0, y: 0 },
    },
  ]
})

const handleDragStart = async (e: DragEvent, type: ConfigNodeType) => {
  // Get drag origin position and dimensions for calculating anchor point
  const item = e.currentTarget as HTMLElement
  const { left, top, width, height } = item.getBoundingClientRect()
  const offsetX = e.clientX - left
  const offsetY = e.clientY - top

  // Create preview node and wait for DOM update
  previewNode.value = createNode({ type })
  await nextTick()

  // Get the rendered preview element or fallback to original item
  const preview = document.querySelector<HTMLElement>(`#${previewId}`) || item

  // Create temporary clone for drag image
  const clone = preview.cloneNode(true) as HTMLElement
  clone.classList.add('dk-drag-snapshot')
  const { offsetWidth: previewWidth, offsetHeight: previewHeight } = preview

  Object.assign(clone.style, {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: `${previewWidth}px`,
    height: `${previewHeight}px`,
  })

  document.body.appendChild(clone)

  // Calculate anchor ratios to maintain relative cursor position
  const ratioX = offsetX / width
  const ratioY = offsetY / height
  const anchor = { ratioX, ratioY, offsetX: previewWidth * ratioX, offsetY: previewHeight * ratioY }

  // Set drag data and custom drag image
  const payload: DragPayload = {
    action: 'create-node',
    data: {
      type,
      anchor,
    },
  }
  e.dataTransfer?.setData(DK_DATA_TRANSFER_MIME_TYPE, JSON.stringify(payload))
  e.dataTransfer?.setData(`${DK_DATA_TRANSFER_MIME_TYPE}/${type}`, type)
  e.dataTransfer?.setDragImage(
    clone,
    anchor.offsetX,
    anchor.offsetY,
  )

  // Clean up temporary elements
  requestAnimationFrame(() => {
    clone.remove()
    previewNode.value = undefined
  })
}
</script>

<style lang="scss" scoped>
.dk-node-panel {

  .title {
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-bold;
    gap: $kui-space-40;
    line-height: $kui-line-height-30;
    margin: 0;
  }

  .label {
    margin: 0;
  }

  .node-list {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    margin-top: $kui-space-40;
  }

  .preview {
    height: 1px;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    width: 1px;
  }
}
</style>

<style lang="scss">
.dk-drag-snapshot, .dk-drag-snapshot * {
  &,
  &::before,
  &::after {
    box-sizing: border-box;
  }
}
</style>
