<template>
  <KCard
    class="controls"
    title="Controls"
  >
    <KInputSwitch
      v-model="skeleton"
      label="Skeleton"
    />
  </KCard>

  <WaterfallView
    v-for="(root, i) in spanRoots"
    :key="i"
    :root-span="root"
    :skeleton="skeleton"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildSpanTrees, WaterfallView } from '../../src'
import rawSpans from '../fixtures/spans.json'

const skeleton = ref(false)
const spanRoots = computed(() => buildSpanTrees(rawSpans))
</script>

<style lang="scss" scoped>
.controls {
  margin-bottom: 16px;
}
</style>
