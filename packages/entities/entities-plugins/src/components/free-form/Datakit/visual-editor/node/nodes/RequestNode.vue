<template>
  <ImplicitNode
    class="request-node"
    :output-handles="outputHandles"
  >
    <template #title>
      request
    </template>
  </ImplicitNode>
</template>

<script setup lang="ts">
import ImplicitNode from './ImplicitNode.vue'
import type { IOHandle } from './types'

const outputHandles: IOHandle[] = [
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
