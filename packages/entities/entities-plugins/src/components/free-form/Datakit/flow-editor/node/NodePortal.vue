<template>
  <div
    class="dk-node-portal"
    :class="{ expanded: isExpanded, reversed }"
    @click.stop
    @dragstart.stop
    @mousedown.stop
    @mouseenter="localExpanded = true"
    @mouseleave="localExpanded = false"
  >
    <div
      class="target-boxes"
      :style="containerStyle"
    >
      <KTooltip
        v-for="(target, index) in targetBoxItems"
        :key="target.key"
        class="target-box-wrapper"
        :kpop-attributes="popoverAttributes"
        placement="top"
        :style="target.style"
        :text="target.tooltip"
      >
        <div
          class="target-box"
          :class="{ highlighted: target.highlighted }"
          @click.stop="handleTargetClick(target.edgeId)"
        >
          <component
            :is="target.icon"
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="ICON_SIZE"
          />
          <span
            v-if="index === 0 && additionalCount > 0"
            class="additional-count"
          >
            +{{ additionalCount }}
          </span>
        </div>
      </KTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_SPACE_10 } from '@kong/design-tokens'
import { KTooltip } from '@kong/kongponents'
import { NODE_VISUAL } from './node-visual'
import { useEditorStore } from '../store/store'

import type { EdgeId, FieldName, NodeInstance, NonEmptyArray } from '../../types'

interface PortalTarget {
  edgeId: EdgeId
  node: NodeInstance
  fieldName?: FieldName
}

const BOX_SIZE = 24
const ICON_SIZE = 16
const BOX_GAP = Number.parseFloat(KUI_SPACE_10) || 0

const {
  expanded = undefined,
  reversed,
  targets,
} = defineProps<{
  expanded?: boolean
  reversed?: boolean
  targets: NonEmptyArray<PortalTarget>
}>()

const popoverAttributes = {
  target: 'body',
}

const { portalSelection: selectedPortalEdgeId, selectPortalEdge } = useEditorStore()
const localExpanded = ref(false)

const hasHighlightedTarget = computed(() => {
  const current = selectedPortalEdgeId.value
  if (!current) return false
  return targets.some((target) => target.edgeId === current)
})

const isExpanded = computed(() => {
  if (expanded !== undefined) {
    return expanded || hasHighlightedTarget.value
  }
  return localExpanded.value || hasHighlightedTarget.value
})

const getExpandedWidth = () =>
  BOX_SIZE * targets.length + BOX_GAP * (targets.length - 1)

const containerStyle = computed(() => ({
  width: isExpanded.value
    ? `${getExpandedWidth()}px`
    : 'fit-content',
}))

const handleTargetClick = (edgeId: EdgeId) => {
  selectPortalEdge(edgeId)
}

const isTargetHighlighted = (edgeId: EdgeId) => selectedPortalEdgeId.value === edgeId

const targetBoxItems = computed(() =>
  targets.map((target, index) => {
    const offset = (BOX_SIZE + BOX_GAP) * index

    return {
      edgeId: target.edgeId,
      key: `${target.node.id}-${target.fieldName ?? 'node'}-${index}`,
      icon: NODE_VISUAL[target.node.type]?.icon,
      tooltip: target.fieldName
        ? `${target.node.name}.${target.fieldName}`
        : target.node.name,
      highlighted: isTargetHighlighted(target.edgeId),
      tooltipEl: null as HTMLElement | null,
      style:
        index === 0
          ? {
            width: 'fit-content',
            zIndex: targets.length,
          }
          : {
            position: 'absolute',
            ...(reversed
              ? {
                left: `${offset}px`,
                transform: isExpanded.value
                  ? 'translateX(0)'
                  : `translateX(-${offset}px)`,
              }
              : {
                right: 0,
                transform: isExpanded.value
                  ? `translateX(-${offset}px)`
                  : 'translateX(0)',
              }),
            zIndex: targets.length - index,
          },
    }
  }),
)

const additionalCount = computed(() => Math.max(targets.length - 1, 0))
</script>

<style lang="scss" scoped>
$connector-length: 12px;
$box-size: 24px;

.dk-node-portal {
  cursor: default;
  left: -$connector-length;
  position: absolute;
  top: 50%;
  transform: translate(-100%, -50%);

  .target-boxes {
    display: flex;
    gap: var(--kui-space-10, $kui-space-10);
    justify-content: flex-end;
    overflow: visible;
    position: relative;
    transition: width var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
  }

  .target-box-wrapper {
    flex-shrink: 0;
    height: $box-size;
    transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
    width: $box-size;
  }

  .target-box {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    border: 1px solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    display: flex;
    height: $box-size;
    justify-content: center;
    min-width: $box-size;
    padding: 0 calc(var(--kui-space-20, $kui-space-20) - 1px);
    width: 100%;

    .additional-count {
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      display: inline-flex;
      font-size: var(--kui-font-size-10, $kui-font-size-10);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      margin-left: var(--kui-space-10, $kui-space-10);
      overflow: hidden;
      transition: margin-left var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out,
        max-width var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
      white-space: nowrap;
    }

    &:hover {
      border-color: var(--kui-color-border-primary-weak, $kui-color-border-primary-weak);
    }

    &.highlighted {
      border-color: var(--kui-color-border-primary, $kui-color-border-primary);
      border-width: 1.5px;
      padding: 0 (var(--kui-space-20, $kui-space-20) - 1.5px);
    }
  }

  &.expanded {
    .additional-count {
      margin-left: 0;
      max-width: 0;
    }
  }

  &::after {
    border-top: 1px dashed var(--kui-color-border-neutral, $kui-color-border-neutral);
    content: "";
    height: 1px;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
    width: $connector-length;
  }

  // Reversed positioning
  &.reversed {
    left: calc(100% + $connector-length);
    transform: translateY(-50%);

    .target-boxes {
      justify-content: flex-start;
    }

    &::after {
      left: 0;
      right: auto;
      transform: translate(-100%, -50%);
    }
  }
}
</style>
