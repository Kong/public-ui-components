<template>
  <WaterfallView
    v-for="(root, i) in spanRoots"
    :key="i"
    :root-span="root"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSpanTrees, WaterfallView } from '../../src'
import rawSpans from '../fixtures/spans.json'

const spanRoots = computed(() => buildSpanTrees(rawSpans))
</script>
