<template>
  <KBadge
    appearance="neutral"
    class="dk-node-badge"
    :class="{
      'icon-only': iconOnly,
      'has-visual': !!visual,
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
import type { NodeType } from '../../types'
import { CONFIG_NODE_META_MAP, getNodeTypeName, isConfigType } from './node'
import type { BadgeSize } from '@kong/kongponents'

const { type } = defineProps<{
  type: NodeType
  size?: BadgeSize
  iconOnly?: boolean
}>()

const visual = computed(() => {
  if (isConfigType(type)) {
    const { icon, colors } = CONFIG_NODE_META_MAP[type]
    return { icon, background: colors?.background, foreground: colors?.foreground }
  }
  return undefined
})

const nodeName = computed(() => getNodeTypeName(type))
</script>

<style lang="scss" scoped>
.dk-node-badge {
  &.has-visual {
    background: v-bind("visual?.background") !important;
    color: v-bind("visual?.foreground") !important;
  }

  &.icon-only {
    :deep(.badge-content-wrapper) {
      display: none;
    }
  }
}

</style>
