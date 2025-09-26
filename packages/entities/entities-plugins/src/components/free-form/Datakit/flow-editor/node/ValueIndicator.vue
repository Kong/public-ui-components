<template>
  <div
    class="value-indicator"
    :class="{ selected, reversed }"
    tabindex="0"
    @click.stop="handleClick"
    @keydown="handleKeyDown"
  >
    <KTooltip
      placement="top"
      :text="tooltipText"
    >
      <div class="indicator-box">
        <icon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="16"
        />
      </div>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import {
  KUI_COLOR_TEXT_NEUTRAL,
} from '@kong/design-tokens'
import type { EdgeId, NodeInstance } from '../../types'
import { computed } from 'vue'
import { KTooltip } from '@kong/kongponents'
import { CONFIG_NODE_META_MAP, IMPLICIT_NODE_META_MAP, isImplicitType } from './node'

interface Props {
  edgeId: EdgeId
  selected?: boolean
  sourceNode: NodeInstance
  sourceFieldName?: string
  reversed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  reversed: false,
})

const emit = defineEmits<{
  select: [edgeId: EdgeId]
  delete: [edgeId: EdgeId]
}>()

const DELETE_KEYS = ['Delete', 'Backspace'] as const

const isVaultNode = computed(() => {
  return props.sourceNode.type === 'vault'
})

const tooltipText = computed(() => {
  if (props.sourceFieldName) {
    return `${props.sourceNode.name}.${props.sourceFieldName}`
  }
  return props.sourceNode.name
})

function handleClick() {
  emit('select', props.edgeId)
}

function handleKeyDown(event: KeyboardEvent) {
  if (DELETE_KEYS.includes(event.key as typeof DELETE_KEYS[number])) {
    event.preventDefault()
    emit('delete', props.edgeId)
  }
}

const icon = computed(() => {
  if (!isImplicitType(props.sourceNode.type)) {
    return CONFIG_NODE_META_MAP[props.sourceNode.type]?.icon ?? undefined
  } else {
    return IMPLICIT_NODE_META_MAP[props.sourceNode.type]?.icon ?? undefined
  }
})


</script>

<style lang="scss" scoped>
.value-indicator {
  left: -36px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;

  .indicator-box {
    align-items: center;
    background-color: $kui-color-background;
    border: 1px solid $kui-color-border-neutral-weak;
    border-radius: $kui-border-radius-10;
    cursor: pointer;
    display: flex;
    height: 24px;
    justify-content: center;
    transition: all $kui-animation-duration-20 ease-in-out;
    width: 24px;

    &:hover {
      border-color: $kui-color-border-primary-weak;
    }
  }

  &.selected {
    .indicator-box {
      border: 1px solid $kui-color-border-primary;
    }
  }

  &::after {
    border-top: 1px dashed $kui-color-border-neutral;
    content: '';
    height: 1px;
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    transition: border-color $kui-animation-duration-20 ease-in-out;
    width: 12px;
  }

  &.selected::after {
    border-top-color: $kui-color-border-primary;
  }

  // Reversed positioning
  &.reversed {
    left: auto;
    right: -36px;

    &::after {
      left: -12px;
      right: auto;
    }
  }
}
</style>
