<template>
  <div class="dk-node">
    <div class="body">
      <div class="title">
        <slot name="title" />
      </div>

      <slot />
    </div>

    <div
      class="input-handles"
      :class="{ reverse: ioDirection === 'rl' }"
    >
      <div
        v-for="handle in inputHandles"
        :key="`input-${handle.id}`"
      >
        <div class="handle">
          <Handle
            :id="`input-${handle.id}`"
            :position="ioDirection === 'lr' ? Position.Left : Position.Right"
            type="target"
          />

          <div class="handle-label">
            {{ handle.label }}
          </div>
        </div>
      </div>
    </div>

    <div
      class="output-handles"
      :class="{ reverse: ioDirection === 'rl' }"
    >
      <div
        v-for="handle in outputHandles"
        :key="`output-${handle.id}`"
      >
        <div class="handle">
          <div class="handle-label">
            {{ handle.label }}
          </div>
          <Handle
            :id="`output-${handle.id}`"
            :position="ioDirection === 'lr' ? Position.Right : Position.Left"
            type="source"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { DKNodeHandle } from './types'

withDefaults(defineProps<{
  /**
   * Input handles for the node. By default, these handles are displayed on the left side of the node.
   */
  inputHandles?: DKNodeHandle[]

  /**
   * Output handles for the node. By default, these handles are displayed on the right side of the node.
   */
  outputHandles?: DKNodeHandle[]

  /**
   * Specify the direction of the input/output. This affects the position of the input/output handles.
   *
   * @default 'lr' (left to right)
   */
  ioDirection?: 'lr' | 'rl'
}>(), {
  inputHandles: undefined,
  outputHandles: undefined,
  ioDirection: 'lr',
})
</script>

<style lang="scss" scoped>
.dk-node {
  background-color: $kui-color-background-disabled;
  border-radius: $kui-border-radius-20;
  min-width: 120px;
  padding: $kui-space-40 0;

  .body {
    padding: 0 $kui-space-40;

    .title {
      font-weight: $kui-font-weight-semibold;
      margin-bottom: $kui-space-40;
    }
  }

  .input-handles,
  .output-handles {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    position: relative;

    .handle {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-self: start;

      .handle-label {
        background-color: $kui-color-background-neutral-strong;
        border-radius: $kui-border-radius-20;
        color: $kui-color-text-inverse;
        font-size: $kui-font-size-20;
        font-weight: $kui-font-weight-semibold;
        padding: $kui-space-10;
      }
    }

    :deep(.vue-flow__handle) {
      background-color: $kui-color-background-neutral; // gray.60 (we don't have a gray.50 in design tokens)
      border: none;
      border-radius: $kui-border-radius-round;
      bottom: unset;
      height: 10px;
      left: unset;
      position: relative;
      right: unset;
      top: unset;
      transform: unset;
      width: 3px;
    }
  }

  .input-handles {
    align-items: flex-start;
    transform: translateX(-1px);
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(1px);
  }

  &.handle {
    .input-handles,
    .output-handles {
      .handle {
        flex-direction: row-reverse;
      }
    }

    .input-handles {
      align-items: flex-end;
      transform: translateX(1px);
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(-1px);
    }
  }
}
</style>
