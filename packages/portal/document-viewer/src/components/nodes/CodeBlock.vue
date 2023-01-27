<template>
  <pre><code><slot /></code></pre>
</template>

<style scoped>
pre {
  background: var(--document-viewer-code-block-background, #f1f1f1);
  border-radius: var(--document-viewer-code-block-border-radius, 3px);
  color: var(--document-viewer-code-block-color, inherit);
  font-family: var(--document-viewer-code-block-font-family, var(--document-viewer-font-family-monospace));
  font-size: var(--document-viewer-code-block-font-size, 14px);
}
</style>
