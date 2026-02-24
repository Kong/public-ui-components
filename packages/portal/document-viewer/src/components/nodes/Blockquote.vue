<template>
  <blockquote>
    <slot />
  </blockquote>
</template>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
blockquote {
  background: var(--kong-ui-document-viewer-blockquote-background, #f1f1f5);
  border-left: $kui-border-width-20 solid var(--kong-ui-document-viewer-blockquote-border, #0b172d);
  border-radius: var(--kong-ui-document-viewer-blockquote-border-radius, $kui-border-radius-20);
  font-size: $kui-font-size-30;
  margin: $kui-space-50;
  padding: $kui-space-50;

  :deep(blockquote p) {
    margin-bottom: $kui-space-0;
  }

  :deep(p:last-of-type) {
    margin-bottom: $kui-space-0;
  }
}
</style>
