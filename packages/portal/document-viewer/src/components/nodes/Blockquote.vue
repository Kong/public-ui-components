<template>
  <blockquote>
    <slot />
  </blockquote>
</template>

<style scoped>
blockquote {
  background: var(--document-viewer-blockquote-background, #f8f8fa);
  border-left: 2.5px solid var(--text_colors-accent, #0b172d);
  border-radius: var(--document-viewer-blockquote-border-radius, 3px);
  font-size: 14px;
  padding: var(--spacing-sm, 12px);
  margin: var(--spacing-sm, 12px) var(--spacing-sm, 12px);
}
</style>
