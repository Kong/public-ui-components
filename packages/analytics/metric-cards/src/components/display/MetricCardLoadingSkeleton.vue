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

  &-large {
    padding: 6px;
    row-gap: 12px;
    width: 240px;
  }

  &-small {
    padding: 4px;
    row-gap: 6px;
    width: 120px;

    .box {
      height: 8px;
    }
  }

  @media (max-width: ($viewport-md - 1px)) {
    width: auto;
  }
}
</style>
