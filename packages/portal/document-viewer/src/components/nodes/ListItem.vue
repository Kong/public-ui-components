<template>
  <li>
    <slot />
  </li>
</template>

<style lang="scss" scoped>
li {
  margin-top: 8px;

  :deep(>) {
    ul, ol {
      margin-bottom: unset;
      margin-left: 16px !important;
    }

    p, span {
      display: inline-flex;
      margin-bottom: 0;

      > input[type="checkbox"] {
        margin: 0 4px 0 0;
      }
    }
  }
}
</style>
