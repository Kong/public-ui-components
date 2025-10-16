<template>
  <KBadge
    appearance="neutral"
    class="dk-node-badge"
    :class="{
      'icon-only': iconOnly,
      'has-colors': !!visual.colors,
    }"
    :size="size"
  >
    <template
      v-if="visual?.icon"
      #icon
    >
      <component :is="visual.icon" />
    </template>
    {{ nodeName }}
  </KBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeVisual } from '../../types'
import { type NodeType } from '../../types'
import { getNodeTypeName } from './node'
import type { BadgeSize } from '@kong/kongponents'
import { NODE_VISUAL } from './node-visual'

const { type } = defineProps<{
  type: NodeType
  size?: BadgeSize
  iconOnly?: boolean
}>()

const visual = computed<NodeVisual>(() => NODE_VISUAL[type])

const nodeName = computed(() => getNodeTypeName(type))
</script>

<style lang="scss" scoped>
.dk-node-badge {
  &.has-colors {
    background: v-bind("visual.colors?.background") !important;
    color: v-bind("visual.colors?.foreground") !important;
  }

  &.icon-only {
    :deep(.badge-content-wrapper) {
      display: none;
    }
  }
}
</style>
