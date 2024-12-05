<template>
  <KCard
    class="controls"
    title="Controls"
  >
    <KInputSwitch
      v-model="showSkeleton"
      label="Skeleton"
    />
  </KCard>

  <WaterfallView
    v-for="(root, i) in spanTrees.roots"
    :key="i"
    :root-span="root"
    :show-skeleton="showSkeleton"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildSpanTrees, WaterfallView } from '../../src'
import rawSpans from '../fixtures/spans.json'

const showSkeleton = ref(false)
const spanTrees = computed(() => buildSpanTrees(rawSpans))
</script>

<style lang="scss" scoped>
.controls {
  margin-bottom: 16px;
}
</style>
