<template>
  <table>
    <slot />
  </table>
</template>

<style scoped lang="scss">
/* stylelint-disable @kong/design-tokens/token-var-usage */
table {
  border: 1px solid var(--kong-ui-document-viewer-color, $kui-color-border);
  border-collapse: collapse;
  font-size: $kui-font-size-30;
  margin-bottom: $kui-space-60;
}
</style>
