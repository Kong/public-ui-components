<template>
  <div
    class="handle-twig"
    :class="[type, direction]"
    :style="twigStyle"
  />
</template>

<script setup lang="ts">
import { KUI_SPACE_40 } from '@kong/design-tokens'
import { computed } from 'vue'

const {
  color,
  direction = 'left',
  size = Number.parseFloat(KUI_SPACE_40),
  type,
} = defineProps<{
  color?: string
  direction?: 'left' | 'right'
  size?: number
  type: 'bar' | 'trident' | 'corner'
}>()

const twigStyle = computed(() => ({
  width: `${size}px`,
  minWidth: `${size}px`,
}))
</script>

<style lang="scss" scoped>
.handle-twig {
  height: 100%;
  left: 0;
  overflow: hidden;
  position: absolute;
  top: 0;
  z-index: -1;

  &.bar::before {
    border-left: 1px solid v-bind(color);
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    transform: translateX(calc(50% - 0.5px)) translateY(50%) translateZ(0);
    width: 100%;
  }

  &.trident {
    &::before {
      border-left: 1px solid v-bind(color);
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      transform: translateX(calc(50% - 0.5px)) translateZ(0);
      width: 100%;
    }

    &::after {
      border-bottom: 1px solid v-bind(color);
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      transform: translateX(50%) translateY(calc(-50%)) translateZ(0);
      width: 100%;
    }
  }

  &.corner::before {
    border-bottom: 1px solid v-bind(color);
    border-left: 1px solid v-bind(color);
    border-radius: $kui-border-radius-10;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    transform: translateX(calc(50% - 0.5px)) translateY(-50%) translateZ(0);
    width: 100%;
  }

  &.right {
    left: unset;
    right: 0;

    &.bar::before {
      border-left: unset;
      border-right: 1px solid v-bind(color);
      left: unset;
      right: 0;
      transform: translateX(calc(-50% + 0.5px)) translateY(50%) translateZ(0);
    }

    &.trident {
      &::before {
        border-left: unset;
        border-right: 1px solid v-bind(color);
        left: unset;
        right: 0;
        transform: translateX(calc(-50% + 0.5px)) translateZ(0);
      }

      &::after {
        border-bottom: 1px solid v-bind(color);
        left: unset;
        right: 0;
        transform: translateX(-50%) translateY(calc(-50%)) translateZ(0);
      }
    }

    &.corner::before {
      border-left: unset;
      border-right: 1px solid v-bind(color);
      left: unset;
      right: 0;
      transform: translateX(calc(-50% + 0.5px)) translateY(-50%) translateZ(0);
    }
  }
}
</style>
