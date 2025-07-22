<template>
  <DKNode
    class="request-node"
    :output-handles="outputHandles"
  >
    <template #title>
      request
    </template>
  </DKNode>
</template>

<script setup lang="ts">
import DKNode from './DKNode.vue'
import type { DKNodeHandle } from './types'

const outputHandles: DKNodeHandle[] = [
  {
    id: 'headers',
    label: 'headers',
  },
  {
    id: 'body',
    label: 'body',
  },
  {
    id: 'query',
    label: 'query',
  },
]
</script>

<style lang="scss" scoped>
.request-node {
  background-color: $kui-color-background-disabled;
}
</style>
