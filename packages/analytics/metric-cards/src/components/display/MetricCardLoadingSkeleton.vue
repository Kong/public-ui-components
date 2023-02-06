<template>
  <div class="loading-tabs">
    <KSkeletonBox
      width="100"
    />
    <KSkeletonBox
      width="100"
    />
    <KSkeletonBox
      width="75"
    />
  </div>
</template>
<script setup lang="ts">
import { KSkeletonBox } from '@kong/kongponents'
</script>
<style lang="scss" scoped>
.loading-tabs {
  min-width: 240px;
  padding: 16px;
}
</style>
