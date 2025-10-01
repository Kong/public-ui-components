<template>
  <div
    :class="['dk-branch-group-node', { reversed }]"
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

import type { FlowGroupNodeData } from '../store/flow'

const props = defineProps<{
  data: FlowGroupNodeData
}>()

const reversed = computed(() => props.data.phase === 'response')
const handlePosition = computed(() => reversed.value ? Position.Right : Position.Left)
</script>

<style scoped lang="scss">
@use 'sass:color';

$opacity: 0.5;
$branch-handle-size: 4px;

.dk-branch-group-node {
  background: color.adjust($kui-color-background-neutral-weakest, $alpha: 1 - $opacity);
  border: 1px solid color.adjust($kui-color-border-disabled, $alpha: 1 - $opacity);
  border-radius: $kui-border-radius-20;
  height: 100%;
  position: relative;
  width: 100%;

  :deep(.vue-flow__handle) {
    background-color: $kui-color-background-neutral;
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
  }

  &.reversed {
    :deep(.vue-flow__handle) {
      left: unset;
      right: -0.5px;
      transform: translate(50%, -50%) rotate(45deg);
    }
  }
}
</style>
