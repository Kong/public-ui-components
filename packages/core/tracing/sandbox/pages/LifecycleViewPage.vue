<template>
  <LifecycleView :root-span="spanTrees.roots[0]" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSpanTrees, LifecycleView, mergeSpansInTraceBatches } from '../../src'
import traceBatches from '../fixtures/trace-batches.json'

const spanTrees = computed(() => buildSpanTrees(mergeSpansInTraceBatches(traceBatches)))
</script>

<style lang="scss" scoped>
.controls {
  margin-bottom: 16px;
}
</style>
