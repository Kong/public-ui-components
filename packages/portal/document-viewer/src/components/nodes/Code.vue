<template>
  <code>
    <slot />
  </code>
</template>

<style lang="scss" scoped>
code {
  background: var(--kong-ui-document-viewer-code-background, #f1f1f1);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kong-ui-document-viewer-code-color, inherit);
  font-family: var(--kong-ui-document-viewer-code-font-family, var(--kui-font-family-code, $kui-font-family-code));
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
}
</style>
