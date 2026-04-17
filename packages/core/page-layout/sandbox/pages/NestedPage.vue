<template>
  <div
    v-for="i in 5"
    :key="i"
    class="page-content-block"
  />
</template>

<style lang="scss" scoped>
.page-content-block {
  background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  height: 20vh;
}
</style>
