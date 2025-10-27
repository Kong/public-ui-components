<template>
  <div
    :class="['dk-branch-group-node', { reversed, 'drop-target': active }]"
  >
    <Handle
      id="input"
      :connectable="false"
      :position="handlePosition"
      type="target"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

import type { FlowGroupNodeData } from '../../types'

const props = defineProps<{
  data: FlowGroupNodeData
  active?: boolean
}>()

const reversed = computed(() => props.data.phase === 'response')
const handlePosition = computed(() => reversed.value ? Position.Right : Position.Left)
</script>

<style scoped lang="scss">
@use 'sass:color';
@use "sass:math";

$opacity: 0.2;
$branch-handle-size: 4px;

$one-over-sqrt2-px: math.pow(2, -0.5) * 1px;

.dk-branch-group-node {
  background: rgba($kui-color-background-neutral-weak, $opacity);
  border: 1px solid rgba($kui-color-border-disabled, $opacity);
  border-radius: $kui-border-radius-20;
  height: 100%;
  position: relative;
  width: 100%;

  :deep(.vue-flow__handle) {
    background-color: transparent;
    border: none;
    border-radius: 0;
    height: $branch-handle-size;
    left: -0.5px;
    min-height: 0;
    min-width: 0;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    width: $branch-handle-size;

    &::after {
      background-color: $kui-color-background-neutral;
      content: "";
      display: block;
      height: 100%;
      left: -$one-over-sqrt2-px;
      position: relative;
      top: -$one-over-sqrt2-px;
      width: 100%;
    }
  }

  &.reversed {
    :deep(.vue-flow__handle) {
      left: unset;
      right: -0.5px;
      transform: translate(50%, -50%) rotate(45deg);
    }
  }

  &.drop-target {
    border-color: $kui-color-border-primary;
  }
}
</style>
