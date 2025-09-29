<template>
  <div class="dk-branch-group-node" />
</template>

<style scoped lang="scss">
@use 'sass:color';

$opacity: 0.5;

.dk-branch-group-node {
  background: color.adjust($kui-color-background-neutral-weakest, $alpha: 1 - $opacity);
  border: 1px solid color.adjust($kui-color-border-disabled, $alpha: 1 - $opacity);
  border-radius: $kui-border-radius-20;
}
</style>
