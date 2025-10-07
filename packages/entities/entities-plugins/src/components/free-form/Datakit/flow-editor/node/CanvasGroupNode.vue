<template>
  <div
    class="flow-group-node"
    :style="style"
  />
</template>

<script setup lang="ts">
import type { Dimensions } from '@vue-flow/core'
import { computed } from 'vue'

const { size } = defineProps<{
  size: Dimensions
}>()

const style = computed(() => ({
  width: `${size.width}px`,
  height: `${size.height}px`,
}))
</script>

<style lang="scss" scoped>
.flow-group-node {
  background-color: rgba(#AFB7C5, 0.2);
  border-radius: $kui-border-radius-20;
  cursor: move;
  padding: $kui-space-40 0;
}
</style>
