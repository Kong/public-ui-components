<template>
  <div
    v-for="i in 5"
    :key="i"
    class="page-content-block"
  />
</template>

<style lang="scss" scoped>
.page-content-block {
  background-color: $kui-color-background-neutral-weak;
  border-radius: $kui-border-radius-30;
  height: 20vh;
}
</style>
