<template>
  <div class="io-node">
    <slot />

    <div class="input-handles">
      <div
        v-for="handle in inputHandles"
        :key="`input-${handle.id}`"
      >
        <div class="handle">
          <Handle
            :id="`input-${handle.id}`"
            :position="Position.Left"
            type="target"
          />

          <div class="handle-label">
            {{ handle.label }}
          </div>
        </div>
      </div>
    </div>

    <div class="output-handles">
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
            :position="Position.Right"
            type="source"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export interface IONodeComponentProps {
  inputHandles?: IOHandle[]
  outputHandles?: IOHandle[]
}
</script>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { IOHandle } from './types'

defineProps<IONodeComponentProps>()
</script>

<style lang="scss" scoped>
.io-node {
  padding: $kui-space-40 0;

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
      justify-content: flex-end;

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

    .handle {
      justify-content: flex-start;
    }
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(1px);

    .handle {
      justify-content: flex-end;
    }
  }
}
</style>
