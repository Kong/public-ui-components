<template>
  <header
    class="page-header"
  >
    <div class="row">
      <component
        :is="`h${size}`"
        :class="{ 'title-no-margin': noMargin }"
      >
        <span
          v-if="!hideTitle"
          class="title"
        >{{ title }}</span>
        <slot name="title-logo" />
      </component>
      <nav class="operations">
        <slot />
      </nav>
    </div>
    <slot name="below-title" />
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  size: number
  hideTitle?: boolean
  noMargin?: boolean
}>()

</script>

<style lang="scss" scoped>
.page-header h1, h2, h3, h4, h5, h6 {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-70, $kui-font-size-70);
  font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);

  .title {
    word-break: break-all;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-left: -var(--kui-space-60, $kui-space-60);
  margin-right: -var(--kui-space-60, $kui-space-60);
  padding: var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);
}

.col {
  line-height: var(--kui-line-height-70, $kui-line-height-70);
}

h1, h2, h3, h4, h5, h6, nav {
  margin-bottom: var(--kui-space-70, $kui-space-70);
  margin-top: var(--kui-space-0, $kui-space-0);
}

.title-no-margin {
  margin: var(--kui-space-0, $kui-space-0) !important;
}

.operations {
  align-items: center;
  display: inline-flex;
  flex-grow: 0;
  justify-content: flex-end;
  margin-left: var(--kui-space-auto, $kui-space-auto);
  text-align: right;
  white-space: nowrap;
}
</style>
