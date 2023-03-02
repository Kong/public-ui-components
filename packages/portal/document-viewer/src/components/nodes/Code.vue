<template>
  <code>
    <slot />
  </code>
</template>

<style scoped>
code {
  background: var(--document-viewer-code-background, #f1f1f1);
  border-radius: var(--document-viewer-code-border-radius, 3px);
  color: var(--document-viewer-code-color, inherit);
  font-family: var(--document-viewer-code-font-family, var(--document-viewer-font-family-monospace));
  font-size: var(--document-viewer-code-font-size, 14px);
  padding: 2px 6px;
}
</style>
