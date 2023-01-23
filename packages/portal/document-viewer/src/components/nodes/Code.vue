<template>
  <code>
    <slot />
  </code>
</template>

<style scoped>
code {
  font-family: var(--document-viewer-code-font-family, var(--document-viewer-font-family-monospace));
  font-size: var(--document-viewer-code-font-size, 14px);
  background: var(--document-viewer-code-background, #f1f1f1);
  color: var(--document-viewer-code-color, inherit);
  border-radius: var(--document-viewer-code-border-radius, 3px);
}
</style>
