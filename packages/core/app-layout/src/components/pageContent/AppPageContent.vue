<template>
  <div class="kong-ui-app-page-content">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.kong-ui-app-page-content {
  $verticalSpacing: $kui-space-70;

  display: flex;
  flex-direction: column;
  row-gap: $verticalSpacing;

  :deep(.kong-ui-app-page-header),
  :deep(.app-about-section),
  & > div,
  & > section {
    margin-bottom: $kui-space-0 !important;
    margin-top: $kui-space-0 !important;
  }

  :deep(.app-page-content-container) {
    display: flex;
    flex-direction: column;
    row-gap: $verticalSpacing;
  }

  :deep(.app-page-content-section) {
    margin-bottom: $verticalSpacing;
  }
}
</style>
