<template>
  <div
    class="value-indicator"
    :class="{ reversed: shouldReverse }"
  >
    <KTooltip
      placement="top"
      :text="tooltipText"
    >
      <div class="indicator-box">
        <icon
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
import type { EdgeId, NodeInstance } from '../../types'
import { computed } from 'vue'
import { KTooltip } from '@kong/kongponents'
import { CONFIG_NODE_META_MAP, IMPLICIT_NODE_META_MAP, isImplicitType } from './node'

interface Props {
  edgeId?: EdgeId
  sourceNode?: NodeInstance
  sourceFieldName?: string
  targetNodes?: NodeInstance[]
  targetFieldNames?: Array<string | undefined>
  mode: 'input' | 'output'
  reversed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  reversed: false,
})


const tooltipText = computed(() => {
  if (props.mode === 'input' && props.sourceNode) {
    if (props.sourceFieldName) {
      return `${props.sourceNode.name}.${props.sourceFieldName}`
    }
    return props.sourceNode.name
  } else if (props.mode === 'output' && props.targetNodes) {
    const names = props.targetNodes.map((node, index) => {
      const fieldName = props.targetFieldNames?.[index]
      return fieldName ? `${node.name}.${fieldName}` : node.name
    })
    return names.join(', ')
  }
  return ''
})

const icon = computed(() => {
  let node: NodeInstance | undefined

  if (props.mode === 'input' && props.sourceNode) {
    node = props.sourceNode
  } else if (props.mode === 'output' && props.targetNodes && props.targetNodes.length > 0) {
    node = props.targetNodes[0]
  }

  if (!node) return undefined

  if (!isImplicitType(node.type)) {
    return CONFIG_NODE_META_MAP[node.type]?.icon ?? undefined
  } else {
    return IMPLICIT_NODE_META_MAP[node.type]?.icon ?? undefined
  }
})

const additionalCount = computed(() => {
  if (props.mode === 'output' && props.targetNodes && props.targetNodes.length > 1) {
    return props.targetNodes.length - 1
  }
  return 0
})

const shouldReverse = computed(() => {
  if (props.mode === 'input') {
    return props.reversed
  } else {
    return !props.reversed
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
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    transition: border-color $kui-animation-duration-20 ease-in-out;
    width: 12px;
  }

  // Reversed positioning
  &.reversed {
    left: calc(100% + 12px);

    &::after {
      left: -12px;
      right: auto;
    }
  }
}
</style>
