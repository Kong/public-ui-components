<template>
  <table>
    <slot />
  </table>
</template>

<style scoped lang="scss">
table {
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-collapse: collapse;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  margin-bottom: var(--kui-space-60, $kui-space-60);
}
</style>
