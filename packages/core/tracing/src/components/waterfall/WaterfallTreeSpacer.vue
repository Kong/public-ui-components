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
  rulerIndents: {
    type: Number,
    default: 1,
    validator: (value: number) => value >= 1,
  },
})

const spacerStyle = computed(() => {
  const width = props.size * (props.type === SpacerType.Ruler ? props.rulerIndents : 1)

  return {
    width: `${width}px`,
    minWidth: `${width}px`,
  }
})
</script>

<style lang="scss" scoped>
.waterfall-tree-spacer {
  height: 100%;
  position: relative;

  &.ruler {
    $width: 1px;
    // Magic XD
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(v-bind("`${props.size / 2}px`") - $width / 2),
      $kui-color-background-neutral-weaker
      calc(v-bind("`${props.size / 2}px`") - $width / 2),
      $kui-color-background-neutral-weaker
      calc(v-bind("`${props.size / 2}px`") + $width / 2),
      transparent calc(v-bind("`${props.size / 2}px`") + $width / 2),
      transparent v-bind("`${props.size}px`")
    );
  }

  &.attach {
    &::before {
      border-left: 1px solid $kui-color-border-neutral-weaker;
      content: "";
      height: 100%;
      left: calc(50% - 0.5px);
      position: absolute;
      top: 0;
    }

    &::after {
      border-bottom: 1px solid $kui-color-border-neutral-weaker;
      content: "";
      left: 50%;
      position: absolute;
      top: calc(50% - 0.5px);
      width: 50%;
    }
  }

  &.corner-attach {
    &::before {
      border-left: 1px solid $kui-color-border-neutral-weaker;
      content: "";
      height: 50%;
      left: calc(50% - 0.5px);
      position: absolute;
      top: 0;
    }

    &::after {
      border-bottom: 1px solid $kui-color-border-neutral-weaker;
      content: "";
      left: 50%;
      position: absolute;
      top: calc(50% - 0.5px);
      width: 50%;
    }
  }
}
</style>
