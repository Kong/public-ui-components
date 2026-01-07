<template>
  <blockquote>
    <slot />
  </blockquote>
</template>

<style lang="scss" scoped>
blockquote {
  background: var(--kong-ui-document-viewer-blockquote-background, #f1f1f5);
  border-left: var(--kui-border-width-20, $kui-border-width-20) solid var(--kong-ui-document-viewer-blockquote-border, #0b172d);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  margin: var(--kui-space-50, $kui-space-50);
  padding: var(--kui-space-50, $kui-space-50);

  :deep(blockquote p) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }

  :deep(p:last-of-type) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }
}
</style>
