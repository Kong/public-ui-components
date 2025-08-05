<template>
  <div class="dk-node-panel">
    <h3 class="title">
      <KLabel
        class="label"
        :info="t('plugins.free-form.datakit.flow_editor.node_panel.description')"
      >
        {{ t('plugins.free-form.datakit.flow_editor.node_panel.title') }}
      </KLabel>
    </h3>
    <div class="node-list">
      <NodePanelItem
        v-for="nodeType in (Object.keys(CONFIG_NODE_META_MAP) as Array<ConfigNodeType>)"
        :key="nodeType"
        draggable="true"
        :type="nodeType"
        @dragstart="(e: DragEvent) => handleDragStart(e, nodeType)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { DK_DATA_TRANSFER_MIME_TYPE } from '../../constants'
import { CONFIG_NODE_META_MAP } from './node'
import NodePanelItem from './NodePanelItem.vue'

import type { ConfigNodeType, DragPayload } from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

const handleDragStart = (e: DragEvent, type: ConfigNodeType) => {
  const payload: DragPayload = {
    action: 'create-node',
    data: {
      type,
    },
  }
  e.dataTransfer?.setData(DK_DATA_TRANSFER_MIME_TYPE, JSON.stringify(payload))
  createCleanSnapshot(e)
}

/**
 * Generates a clean snapshot of the dragged item for use as the drag image.
 * This overrides the browser’s default snapshot behavior, which may capture
 * unrelated UI elements (e.g., tooltips) within the item’s bounding box.
 */
const createCleanSnapshot = (e: DragEvent) => {
  const item = e.currentTarget as HTMLElement
  const { left, top, width, height } = item.getBoundingClientRect()
  const offsetX = e.clientX - left
  const offsetY = e.clientY - top

  const clone = item.cloneNode(true) as HTMLElement

  Object.assign(clone.style, {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: `${width}px`,
    height: `${height}px`,
    boxSizing: 'border-box',
  })

  document.body.appendChild(clone)
  e.dataTransfer?.setDragImage(clone, offsetX, offsetY)

  requestAnimationFrame(() => {
    clone.remove()
  })
}
</script>

<style lang="scss" scoped>
.dk-node-panel {
  padding: $kui-space-60 $kui-space-30;

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
}
</style>
