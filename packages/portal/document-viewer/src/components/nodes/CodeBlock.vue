<template>
  <pre><code><slot /></code></pre>
</template>

<style scoped>
pre {
  font-family: var(--document-viewer-code-block-font-family, var(--document-viewer-font-family-monospace));
  font-size: var(--document-viewer-code-block-font-size, 14px);
  background: var(--document-viewer-code-block-background, #f1f1f1);
  color: var(--document-viewer-code-block-color, inherit);
  border-radius: var(--document-viewer-code-block-border-radius, 3px);
}
</style>
