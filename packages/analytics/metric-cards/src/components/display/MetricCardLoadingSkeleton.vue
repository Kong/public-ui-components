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
    padding: $kui-space-20;
    row-gap: $kui-space-50;
    width: 240px;
  }

  &-small {
    padding: $kui-space-10;
    row-gap: $kui-space-40;
    width: 120px;

    .box {
      height: 12px;
    }
  }

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    width: auto;
  }
}
</style>
