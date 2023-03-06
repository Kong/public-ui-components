<template>
  <table>
    <slot />
  </table>
</template>

<style scoped>
table {
  border: 1px solid var(--document-viewer-color, var(--text_colors-primary, #0b172d));
  border-collapse: collapse;
  font-size: var(--type-sm, 14px);
  margin-bottom: var(--spacing-md, 16px);
}
</style>