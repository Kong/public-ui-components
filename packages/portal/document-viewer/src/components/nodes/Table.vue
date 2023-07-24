<template>
  <table>
    <slot />
  </table>
</template>

<style scoped lang="scss">
table {
  border: 1px solid var(--document-viewer-color, $kui-color-text);
  border-collapse: collapse;
  font-size: $kui-font-size-30;
  margin-bottom: $kui-space-60;
}
</style>
