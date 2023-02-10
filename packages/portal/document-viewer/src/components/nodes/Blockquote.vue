<template>
  <blockquote>
    <slot />
  </blockquote>
</template>

<style lang="scss" scoped>
blockquote {
  background: var(--document-viewer-blockquote-background, #f1f1f5);
  border-left: 2.5px solid var(--document-viewer-blockquote-border, var(--text_colors-accent, #0b172d));
  border-radius: var(--document-viewer-blockquote-border-radius, 3px);
  font-size: 14px;
  margin: var(--spacing-sm, 12px) var(--spacing-sm, 12px);
  padding: var(--spacing-sm, 12px);

  :deep(blockquote p) {
    margin-bottom: 0;
  }

  :deep(p:last-of-type) {
    margin-bottom: 0;
  }
}
</style>
