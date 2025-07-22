<template>
  <DKNode
    class="service-response-node"
    io-direction="rl"
    :output-handles="outputHandles"
  >
    <template #title>
      service response
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
]
</script>

<style lang="scss" scoped>
.service-response-node {
  background-color: $kui-color-background-disabled;
}
</style>
