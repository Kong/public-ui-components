<template>
  <table>
    <slot />
  </table>
</template>

<style scoped>
  table {
    font-size: var(--type-sm, 14px);
    margin-bottom: var(--spacing-md, 16px);
    border: 1px solid var(--document-viewer-color, var(--text_colors-primary, #0b172d));
    border-collapse: collapse;
  }
</style>