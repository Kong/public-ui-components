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
    <template
      v-if="node"
      #title
    >
      <NodeBadge :type="node.type" />
    </template>

    <div
      v-if="node"
      class="dk-node-properties-panel-desc"
      v-html="getNodeTypeDescription(node.type)"
    />

    <component
      :is="form"
      v-if="form"
      class="dk-node-properties-panel-form"
    />
  </KSlideout>
</template>

<script setup lang="ts">
import NodeBadge from './NodeBadge.vue'

import { DK_NODE_PROPERTIES_PANEL_OFFSET_TOP, DK_NODE_PROPERTIES_PANEL_WIDTH } from '../../constants'
import NodeFormCall from './NodeFormCall.vue'
import NodeFormServiceRequest from './NodeFormServiceRequest.vue'
import NodeFormResponse from './NodeFormResponse.vue'
import NodeFormJq from './NodeFormJq.vue'
import NodeFormStatic from './NodeFormStatic.vue'

import { KSlideout } from '@kong/kongponents'
import { getNodeTypeDescription } from './node'
import type { NodeData } from '../../types'
import { computed } from 'vue'

const {
  maxWidth = DK_NODE_PROPERTIES_PANEL_WIDTH,
  offsetTop = DK_NODE_PROPERTIES_PANEL_OFFSET_TOP,
  visible,
  node,
} = defineProps<{
  maxWidth?: string
  offsetTop?: string
  visible?: boolean
  node?: NodeData | null
}>()

defineEmits<{
  close: []
}>()

const form = computed(() => {
  switch (node?.type) {
    case 'call':
      return NodeFormCall
    case 'service_request':
      return NodeFormServiceRequest
    case 'response':
      return NodeFormResponse
    case 'jq':
      return NodeFormJq
    case 'static':
      return NodeFormStatic
    default:
      return null
  }
})
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

  &-desc {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: normal;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-60;
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

  :deep(.dk-node-configuration-label) {
    margin: 0;
  }
}
</style>
