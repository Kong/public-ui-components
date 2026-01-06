<template>
  <p>
    <slot />
  </p>
</template>

<style scoped lang="scss">
p {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  margin: var(--kui-space-0, $kui-space-0);
}
</style>
