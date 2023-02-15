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
import '@kong/kongponents/dist/style.css'
</script>

<style lang="scss" scoped>
@import "../../styles/base";
.loading-tabs {
  display: flex;
  flex-direction: column;
  padding: 16px;
  row-gap: 12px;
  width: 240px;

  @media (max-width: ($viewport-md - 1px)) {
    width: auto;
  }
}
</style>
