<template>
  <div class="support-text">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.support-text {

  color: $kui-color-text;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding-bottom: $kui-space-90;

  :deep(p) {
    font-size: $kui-font-size-30;
    margin-bottom: $kui-space-0;
  }
}

</style>
