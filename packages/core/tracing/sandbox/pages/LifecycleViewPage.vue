<template>
  <div class="lifecycle-view-wrapper">
    <LifecycleView :root-span="spanTrees.roots[0]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSpanTrees, LifecycleView, mergeSpansInTrace } from '../../src'
import trace from '../fixtures/trace.json'
import type { Trace } from '@kong/sdk-konnect-js-internal'

const spanTrees = computed(() => buildSpanTrees(mergeSpansInTrace(trace as unknown as Trace)))
</script>

<style lang="scss" scoped>
.lifecycle-view-wrapper {
  height: 100vh;
  width: 100vw;
}
</style>
