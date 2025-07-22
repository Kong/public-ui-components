<template>
  <DKNode
    class="service-request-node"
    :input-handles="inputHandles"
  >
    <template #title>
      service request
    </template>
  </DKNode>
</template>

<script setup lang="ts">
import DKNode from './DKNode.vue'
import type { DKNodeHandle } from './types'

const inputHandles: DKNodeHandle[] = [
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
.service-request-node {
  background-color: $kui-color-background-disabled;
}
</style>
