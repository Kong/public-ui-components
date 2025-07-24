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
    <div class="dk-node-properties-panel-content">
      <NodeBadge :type="nodeType" />

      <!-- {{ NODE_META_MAP[nodeType].description }} -->

      <template v-if="schema">
        <NodeFormCall class="dk-node-properties-panel-form" />
      </template>
    </div>
  </KSlideout>
</template>

<script setup lang="ts">
import NodeBadge from './NodeBadge.vue'
import { CallNodeSchema } from './mock'

import { DK_NODE_PROPERTIES_PANEL_WIDTH } from '../constants'
import NodeFormCall from './NodeFormCall.vue'

import { KSlideout } from '@kong/kongponents'
// import { NODE_META_MAP } from './node-meta'
import type { NodeType } from '../../types'
import type { FormSchema } from 'src/types/plugins/form-schema'

const nodeType: NodeType = 'call' // This should be dynamically set based on the node type
const schema: FormSchema | undefined = CallNodeSchema // This should be dynamically set based on the node schema

const {
  maxWidth = DK_NODE_PROPERTIES_PANEL_WIDTH,
  offsetTop = '52px',
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
  }

  :deep(.slideout-content) {
    margin-top: -$kui-space-100;
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
  }

  &-form {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;

    > label {
      margin-bottom: $kui-space-0;
    }
  }
}
</style>
