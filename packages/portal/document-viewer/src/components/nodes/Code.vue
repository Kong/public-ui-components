<template>
  <code>
    <slot />
  </code>
</template>

<style lang="scss" scoped>
code {
  background: var(--document-viewer-code-background, #f1f1f1);
  border-radius: var(--document-viewer-code-border-radius, $kui-border-radius-20);
  color: var(--document-viewer-code-color, inherit);
  font-family: var(--document-viewer-code-font-family, var(--document-viewer-font-family-monospace, $kui-font-family-code));
  font-size: var(--document-viewer-code-font-size, $kui-font-size-30);
  padding: $kui-space-10 $kui-space-30;
}
</style>
