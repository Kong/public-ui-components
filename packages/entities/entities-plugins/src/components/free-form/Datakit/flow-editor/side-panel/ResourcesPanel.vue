<template>
  <div class="dk-resources-panel">
    <NodeFormVault />
  </div>
</template>

<script setup lang="ts">
import NodeFormVault from '../node-forms/NodeFormVault.vue'
</script>

<style lang="scss" scoped>
.dk-resources-panel {
  padding: $kui-space-60 0;

  :deep(.title) {
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-bold;
    gap: $kui-space-40;
    line-height: $kui-line-height-30;
    margin: 0;
  }
}
</style>
