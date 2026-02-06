<template>
  <div
    class="dk-node-panel-item"
    :class="{
      [`node-type-${type}`]: true,
      unsupported,
    }"
    :draggable="!unsupported"
    @dragstart="handleDragStart"
  >
    <div class="icon">
      <Icon :size="16" />
    </div>
    <div class="content">
      <div class="title">
        {{ type }}
      </div>
      <div class="description">
        {{ summary }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CONFIG_NODE_META_MAP } from './node'

import type { ConfigNodeType } from '../../types'

const { type, unsupported } = defineProps<{
  type: ConfigNodeType
  unsupported?: boolean
}>()

const emit = defineEmits<{
  dragstart: [e: DragEvent, type: ConfigNodeType]
}>()

const {
  summary,
  icon: Icon,
  colors: { background, foreground } = {},
} = CONFIG_NODE_META_MAP[type]

function handleDragStart(e: DragEvent) {
  emit('dragstart', e, type)
}
</script>

<style lang="scss" scoped>
.dk-node-panel-item {
  align-items: flex-start;
  align-self: stretch;
  background: var(--kui-color-background, $kui-color-background);
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  cursor: grab;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  padding: var(--kui-space-40, $kui-space-40);
  transition: border-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

  &:not(.unsupported):hover {
    border-color: var(--kui-color-border-primary-weak, $kui-color-border-primary-weak);
  }

  &:not(.unsupported):active {
    border-color: var(--kui-color-border-primary, $kui-color-border-primary);
  }

  .icon {
    align-items: center;
    background: v-bind(background);
    border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
    color: v-bind(foreground);
    display: flex;
    padding: var(--kui-space-30, $kui-space-30);
  }

  .content {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
  }

  .title {
    color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .description {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    margin-top: var(--kui-space-10, $kui-space-10);
  }

  &.unsupported {
    cursor: default;
    opacity: 0.5;
    user-select: none;
  }
}
</style>
