<template>
  <p>
    <slot />
  </p>
</template>

<style scoped lang="scss">
p {
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  margin: var(--kong-ui-document-viewer-paragraph-margin, $kui-space-0 $kui-space-0 $kui-space-50);
}
</style>
