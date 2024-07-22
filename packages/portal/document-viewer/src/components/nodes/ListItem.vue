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
      margin-left: $kui-space-60 !important;
    }

    p {
      display: inline-flex;
    }

    span {
      display: inline;
    }

    p,
    span {
      margin-bottom: 0;

      > input[type="checkbox"] {
        margin: $kui-space-0 $kui-space-20 $kui-space-0 $kui-space-0;
      }
    }
  }
}
</style>
