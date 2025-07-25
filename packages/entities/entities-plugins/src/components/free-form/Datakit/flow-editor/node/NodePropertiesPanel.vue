<template>
  <KSlideout
    class="dk-node-properties-panel"
    :close-on-blur="false"
    :has-overlay="false"
    :max-width="maxWidth"
    :offset-top="offsetTop"
    :visible="visible"
    @close="$emit('close')"
  >
    <template #title>
      <div class="dk-node-properties-panel-title">
        <NodeBadge :type="nodeType" />
        <span class="dk-node-properties-panel-desc">
          {{ getNodeTypeDescription(nodeType) }}
        </span>
      </div>
    </template>

    <NodeFormCall class="dk-node-properties-panel-form" />
  </KSlideout>
</template>

<script setup lang="ts">
import NodeBadge from './NodeBadge.vue'

import { DK_NODE_PROPERTIES_PANEL_OFFSET_TOP, DK_NODE_PROPERTIES_PANEL_WIDTH } from '../../constants'
import NodeFormCall from './NodeFormCall.vue'

import { KSlideout } from '@kong/kongponents'
import { getNodeTypeDescription } from './node'
import type { NodeType } from '../../types'

const nodeType: NodeType = 'call' // Fixme: hardcoded

const {
  maxWidth = DK_NODE_PROPERTIES_PANEL_WIDTH,
  offsetTop = DK_NODE_PROPERTIES_PANEL_OFFSET_TOP,
  visible,
  // node,
} = defineProps<{
  maxWidth?: string
  offsetTop?: string
  visible?: boolean
  node?: any
}>()

defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
.dk-node-properties-panel {
  :deep(.slideout-container) {
    box-shadow: none;
    gap: $kui-space-60;
  }

  :deep(.slideout-header) {
    align-items: start;
  }

  &-title {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
  }

  &-desc {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: normal;
    line-height: $kui-line-height-30;
  }

  &-form {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;

    > label {
      margin-bottom: $kui-space-0;
    }

    :deep(.ff-object-field-as-child) {
      gap: $kui-space-60
    }
  }
}
</style>
