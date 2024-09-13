<template>
  <svg
    class="waterfall-tree-control"
    :style="svgStyle"
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
import { computed } from 'vue'

const props = defineProps({
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

const svgStyle = computed(() => ({
  width: `${props.size}px`,
  height: '100%',
  minWidth: `${props.size}px`,
  minHeight: `${props.size}px`,
  transform: `rotate(${!props.expanded ? -90 : 0}deg)`,
  transition: 'transform 0.2s ease-in-out',
}))
</script>

<style lang="scss" scoped>
.waterfall-tree-control {
  fill: $kui-color-text-neutral-weak;
  flex-shrink: 0;

  .control {
    cursor: pointer;
  }
}
</style>
