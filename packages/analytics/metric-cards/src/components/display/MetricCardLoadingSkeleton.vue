<template>
  <div class="loading-tabs">
    <KSkeletonBox
      width="100"
    />
    <KSkeletonBox
      width="75"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "../../styles/base";
.loading-tabs {
  display: flex;
  flex-direction: column;

  &-large {
    padding: 4px;
    row-gap: 12px;
    width: 240px;
  }

  &-small {
    padding: 2px;
    row-gap: 8px;
    width: 120px;

    .box {
      height: 12px;
    }
  }

  @media (max-width: ($viewport-md - 1px)) {
    width: auto;
  }
}
</style>
