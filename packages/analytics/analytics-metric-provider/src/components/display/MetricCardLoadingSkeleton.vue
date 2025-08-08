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
@use "../../styles/globals" as *;

.loading-tabs {
  &-large {
    width: 240px;
  }

  &-small {
    width: 120px;
  }

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    width: auto;
  }
}
</style>
