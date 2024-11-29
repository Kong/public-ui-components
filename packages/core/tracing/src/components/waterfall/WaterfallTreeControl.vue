<template>
  <svg
    class="waterfall-tree-control"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      v-if="!invisible"
      class="control"
      points="25,35 50,65 75,35"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  expanded: {
    type: Boolean,
    default: false,
  },
  invisible: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 20,
    validator: (value: number) => value > 0,
  },
})
</script>

<style lang="scss" scoped>
.waterfall-tree-control {
  cursor: pointer;
  fill: $kui-color-text-neutral-weak;
  flex-shrink: 0;
  height: 100%;
  min-height: v-bind('`${size}px`');
  min-width: v-bind('`${size}px`');
  transform: v-bind('`rotate(${!expanded ? -90 : 0}deg)`');
  width: v-bind('`${size}px`');

  .control {
    cursor: pointer;
  }
}
</style>
