<template>
  <ImplicitNode
    class="request-node"
    :input-handles="inputHandles"
  >
    <template #title>
      service request
    </template>
  </ImplicitNode>
</template>

<script setup lang="ts">
import ImplicitNode from './ImplicitNode.vue'
import type { IOHandle } from './types'

const inputHandles: IOHandle[] = [
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
