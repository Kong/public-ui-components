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
  color: $kui-color-text;
  font-size: $kui-font-size-70;
  font-weight: $kui-font-weight-bold;

  .title {
    word-break: break-all;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-left: -$kui-space-60;
  margin-right: -$kui-space-60;
  padding: $kui-space-0 $kui-space-60;
}

.col {
  line-height: $kui-line-height-70;
}

h1, h2, h3, h4, h5, h6, nav {
  margin-bottom: $kui-space-70;
  margin-top: $kui-space-0;
}

.title-no-margin {
  margin: $kui-space-0 !important;
}

.operations {
  align-items: center;
  display: inline-flex;
  flex-grow: 0;
  justify-content: flex-end;
  margin-left: $kui-space-auto;
  text-align: right;
  white-space: nowrap;
}
</style>
