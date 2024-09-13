<template>
  <div
    :class="['waterfall-tree-spacer', type]"
    :style="spacerStyle"
  />
</template>

<script lang="ts">
export enum SpacerType {
  Ruler = 'ruler',
  Attach = 'attach',
  CornerAttach = 'corner-attach',
}
</script>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

const props = defineProps({
  type: {
    type: String as PropType<SpacerType>,
    required: true,
  },
  size: {
    type: Number,
    default: 20,
    validator: (value: number) => value > 0,
  },
})

const spacerStyle = computed(() => ({
  width: `${props.size}px`,
  minWidth: `${props.size}px`,
}))
</script>

<style lang="scss" scoped>
.waterfall-tree-spacer {
  height: 100%;
  position: relative;

  &.ruler {
    &::before{
      border-left: 1px solid $kui-color-border-neutral-weaker;
      content: '';
      height: 100%;
      left: calc(50% - 0.5px);
      position: absolute;
      top: 0;
    }
  }

  &.attach {
    &::before{
      border-left: 1px solid $kui-color-border-neutral-weaker;
      content: '';
      height: 100%;
      left: calc(50% - 0.5px);
      position: absolute;
      top: 0;
    }

    &::after {
      border-bottom: 1px solid $kui-color-border-neutral-weaker;
      content: '';
      left: 50%;
      position: absolute;
      top: calc(50% - 0.5px);
      width: 50%;
    }
  }

  &.corner-attach {
    &::before{
      border-left: 1px solid $kui-color-border-neutral-weaker;
      content: '';
      height: 50%;
      left: calc(50% - 0.5px);
      position: absolute;
      top: 0;
    }

    &::after {
      border-bottom: 1px solid $kui-color-border-neutral-weaker;
      content: '';
      left: 50%;
      position: absolute;
      top: calc(50% - 0.5px);
      width: 50%;
    }
  }
}
</style>
