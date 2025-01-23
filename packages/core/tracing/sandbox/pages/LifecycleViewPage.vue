<template>
  <div class="lifecycle-view-wrapper">
    <LifecycleView :root-span="spanTrees.roots[0]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSpanTrees, LifecycleView, mergeSpansInTraceBatches } from '../../src'
import traceBatches from '../fixtures/trace-batches.json'

const spanTrees = computed(() => buildSpanTrees(mergeSpansInTraceBatches(traceBatches)))
</script>

<style lang="scss" scoped>
.lifecycle-view-wrapper {
  width: 100vw;
  height: 100vh;
}
</style>
