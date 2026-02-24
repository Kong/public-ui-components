<template>
  <div class="support-text">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.support-text {

  color: var(--kui-color-text, $kui-color-text);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding-bottom: var(--kui-space-90, $kui-space-90);

  :deep(p) {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }
}

</style>
