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
      @transitionend="handleTransitionEnd"
    >
      <KTooltip
        v-for="(target, index) in targetBoxItems"
        :key="target.key"
        :ref="index === 0 ? 'cover' : undefined"
        class="target-box-wrapper"
        placement="top"
        :style="target.style"
        :text="target.tooltip"
      >
        <div class="target-box">
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
import { computed, ref, useTemplateRef, watch } from 'vue'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_SPACE_10 } from '@kong/design-tokens'
import { KTooltip } from '@kong/kongponents'
import { NODE_VISUAL } from './node-visual'

import type { FieldName, NodeInstance, NonEmptyArray } from '../../types'

interface PortalTarget {
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

const localExpanded = ref(false)
const isExpanded = computed(() => expanded ?? localExpanded.value)

const getExpandedWidth = () =>
  BOX_SIZE * targets.length + BOX_GAP * (targets.length - 1)

const coverTarget = useTemplateRef<HTMLElement>('cover')
const transitioningWidth = ref<number | null>(null)

const containerStyle = computed(() => ({
  width:
    transitioningWidth.value !== null
      ? `${transitioningWidth.value}px`
      : isExpanded.value
        ? `${getExpandedWidth()}px`
        : 'fit-content',
}))

const animateWidth = (from: number, to: number) => {
  transitioningWidth.value = from
  requestAnimationFrame(() => {
    transitioningWidth.value = to
  })
}

const handleTransitionEnd = () => {
  transitioningWidth.value = null
}

watch(isExpanded, (expanded) => {
  const el = coverTarget.value
  if (!el) {
    return
  }

  const expandedWidth = getExpandedWidth()
  if (expanded) {
    animateWidth(el.offsetWidth, expandedWidth)
  } else {
    animateWidth(expandedWidth, el.offsetWidth)
  }
})

const targetBoxItems = computed(() =>
  targets.map((target, index) => {
    const offset = (BOX_SIZE + BOX_GAP) * index

    return {
      key: `${target.node.id}-${target.fieldName ?? 'node'}-${index}`,
      icon: NODE_VISUAL[target.node.type]?.icon,
      tooltip: target.fieldName
        ? `${target.node.name}.${target.fieldName}`
        : target.node.name,
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
    gap: $kui-space-10;
    justify-content: flex-end;
    overflow: visible;
    position: relative;
    transition: width $kui-animation-duration-20 ease-in-out;
  }

  .target-box-wrapper {
    flex-shrink: 0;
    height: $box-size;
    transition: transform $kui-animation-duration-20 ease-in-out;
    width: $box-size;
  }

  .target-box {
    align-items: center;
    background-color: $kui-color-background;
    border: 1px solid $kui-color-border-neutral-weak;
    border-radius: $kui-border-radius-20;
    display: flex;
    height: $box-size;
    justify-content: center;
    min-width: $box-size;
    padding: 0 calc($kui-space-20 - 1px);
    width: 100%;

    .additional-count {
      color: $kui-color-text-primary;
      display: inline-flex;
      font-size: $kui-font-size-10;
      font-weight: $kui-font-weight-semibold;
      margin-left: $kui-space-10;
      overflow: hidden;
      transition: margin-left $kui-animation-duration-20 ease-in-out,
        max-width $kui-animation-duration-20 ease-in-out;
      white-space: nowrap;
    }
  }

  &.expanded {
    .additional-count {
      margin-left: 0;
      max-width: 0;
    }
  }

  &::after {
    border-top: 1px dashed $kui-color-border-neutral;
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
