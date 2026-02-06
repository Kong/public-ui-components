<template>
  <code>
    <slot />
  </code>
</template>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
code {
  background: var(--kong-ui-document-viewer-code-background, #f1f1f1);
  border-radius: var(--kong-ui-document-viewer-code-border-radius, $kui-border-radius-20);
  color: var(--kong-ui-document-viewer-code-color, inherit);
  font-family: var(--kong-ui-document-viewer-code-font-family, var(--kong-ui-document-viewer-font-family-monospace, $kui-font-family-code));
  font-size: var(--kong-ui-document-viewer-code-font-size, $kui-font-size-30);
  padding: $kui-space-10 $kui-space-30;
}
</style>
