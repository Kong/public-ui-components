<template>
  <blockquote>
    <slot />
  </blockquote>
</template>

<style scoped>
blockquote {
  font-size: 14px;
  padding: var(--spacing-sm, 12px);
  margin: var(--spacing-sm, 12px) var(--spacing-sm, 12px);
  border-left: 2.5px solid var(--text_colors-accent, #0b172d);
  background: var(--document-viewer-blockquote-background, #f8f8fa);
  border-radius: var(--document-viewer-blockquote-border-radius, 3px);
}
</style>
