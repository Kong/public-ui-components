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
    {{ node?.id }}
  </KSlideout>
</template>

<script setup lang="ts">
import { DK_NODE_PROPERTIES_PANEL_WIDTH } from '../constants'

import { KSlideout } from '@kong/kongponents'

const {
  maxWidth = DK_NODE_PROPERTIES_PANEL_WIDTH,
  offsetTop = '52px',
  visible,
  node,
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
}
</style>
