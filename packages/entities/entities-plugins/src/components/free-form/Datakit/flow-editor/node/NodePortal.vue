<template>
  <div
    class="dk-node-portal"
    :class="{ reversed }"
    @click.stop
    @dragstart.stop
    @mousedown.stop
  >
    <KTooltip
      placement="top"
      :text="tooltipText"
    >
      <div class="target-box">
        <component
          :is="icon"
          v-if="icon"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="16"
        />
        <span
          v-if="additionalCount > 0"
          class="additional-count"
        >
          +{{ additionalCount }}
        </span>
      </div>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { FieldName, NodeInstance, NonEmptyArray } from '../../types'
import { computed } from 'vue'
import { KTooltip } from '@kong/kongponents'
import { NODE_VISUAL } from './node-visual'

interface PortalTarget {
  node: NodeInstance
  fieldName?: FieldName
}

const {
  reversed = false,
  targets,
} = defineProps<{
  reversed?: boolean
  targets: NonEmptyArray<PortalTarget>
}>()

const tooltipText = computed(() => {
  if (!targets.length) return ''

  return targets
    .map(({ node, fieldName }) => fieldName ? `${node.name}.${fieldName}` : node.name)
    .join(', ')
})

const icon = computed(() => {
  return NODE_VISUAL[targets[0].node.type]?.icon
})

const additionalCount = computed(() => Math.max(targets.length - 1, 0))
</script>

<style lang="scss" scoped>
.dk-node-portal {
  cursor: default;
  left: -36px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;

  .target-box {
    align-items: center;
    background-color: $kui-color-background;
    border: 1px solid $kui-color-border-neutral-weak;
    border-radius: $kui-border-radius-20;
    display: flex;
    height: 24px;
    justify-content: center;
    min-width: 24px;
    padding: 0 $kui-space-20;

    .additional-count {
      color: $kui-color-text-primary;
      font-size: $kui-font-size-10;
      font-weight: $kui-font-weight-semibold;
      margin-left: $kui-space-10;
    }
  }

  &::after {
    border-top: 1px dashed $kui-color-border-neutral;
    content: '';
    height: 1px;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
    transition: border-color $kui-animation-duration-20 ease-in-out;
    width: 12px;
  }

  // Reversed positioning
  &.reversed {
    left: calc(100% + 12px);

    &::after {
      left: 0;
      right: auto;
      transform: translate(-100%, -50%);
    }
  }
}
</style>
