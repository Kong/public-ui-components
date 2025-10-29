<template>
  <!-- eslint-disable vue/no-v-html -->
  <KSlideout
    class="dk-node-properties-panel"
    :close-on-blur="false"
    :has-overlay="false"
    :max-width="maxWidth"
    :offset-top="offsetTop"
    :visible="visible"
    :z-index="DK_NODE_PROPERTIES_PANEL_Z_INDEX"
    @close="$emit('close')"
  >
    <template
      v-if="currentNode"
      #title
    >
      <NodeBadge :type="currentNode.type" />
    </template>

    <div
      v-if="currentNode"
      class="dk-node-properties-panel-desc"
      v-html="getNodeTypeDescription(currentNode.type)"
    />

    <Form
      v-if="Form"
      :key="nodeId"
      class="dk-node-properties-panel-form"
      :node-id="nodeId!"
    />
  </KSlideout>
</template>

<script setup lang="ts">
import NodeBadge from './NodeBadge.vue'

import { DK_NODE_PROPERTIES_PANEL_OFFSET_TOP, DK_NODE_PROPERTIES_PANEL_WIDTH, DK_NODE_PROPERTIES_PANEL_Z_INDEX } from '../constants'
import NodeFormCall from '../node-forms/NodeFormCall.vue'
import NodeFormServiceRequest from '../node-forms/NodeFormServiceRequest.vue'
import NodeFormResponse from '../node-forms/NodeFormResponse.vue'
import NodeFormJq from '../node-forms/NodeFormJq.vue'
import NodeFormStatic from '../node-forms/NodeFormStatic.vue'
import NodeFormProperty from '../node-forms/NodeFormProperty.vue'
import NodeFormExit from '../node-forms/NodeFormExit.vue'
import NodeFormBranch from '../node-forms/NodeFormBranch.vue'
import NodeFormCache from '../node-forms/NodeFormCache.vue'

import { KSlideout } from '@kong/kongponents'
import { getNodeTypeDescription } from './node'
import { computed } from 'vue'
import { useEditorStore } from '../../composables'
import type { NodeId } from '../../types'

const { getNodeById } = useEditorStore()
const currentNode = computed(() => nodeId && getNodeById(nodeId))

const {
  maxWidth = `${DK_NODE_PROPERTIES_PANEL_WIDTH}px`,
  offsetTop = `${DK_NODE_PROPERTIES_PANEL_OFFSET_TOP}px`,
  visible,
  nodeId,
} = defineProps<{
  maxWidth?: string
  offsetTop?: string
  visible?: boolean
  nodeId?: NodeId
}>()

defineEmits<{
  close: []
}>()

const Form = computed(() => {
  switch (currentNode.value?.type) {
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
    case 'property':
      return NodeFormProperty
    case 'exit':
      return NodeFormExit
    case 'branch':
      return NodeFormBranch
    case 'cache':
      return NodeFormCache
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
    padding-left: 0;
  }

  :deep(.slideout-header),
  :deep(.slideout-content) {
    padding-left: var(--kui-space-70, $kui-space-70);
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
    font-size: $kui-font-size-40;
    font-weight: 700;
    margin: 0;
  }
}
</style>
