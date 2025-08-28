<template>
  <KBadge
    :appearance="appearance"
    :class="{
      'icon-only': iconOnly,
    }"
    :size="size"
  >
    <template #icon>
      <component :is="icon" />
    </template>
    {{ nodeName }}
  </KBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeType } from '../../types'
import { CONFIG_NODE_META_MAP, getNodeTypeName, isImplicitType } from './node'
import type { BadgeAppearance, BadgeSize } from '@kong/kongponents'

const { type } = defineProps<{
  type: NodeType
  size?: BadgeSize
  iconOnly?: boolean
}>()

const icon = computed(() => {
  if (!isImplicitType(type)) {
    return CONFIG_NODE_META_MAP[type]?.icon ?? undefined
  }
  return undefined
})

const nodeName = computed(() => getNodeTypeName(type))

const appearance = computed<BadgeAppearance>(() => {
  switch (type) {
    case 'call':
      return 'warning'
    case 'jq':
      return 'decorative'
    case 'exit':
      return 'danger'
    case 'property':
      return 'success'
    case 'static':
      return 'info'
    default:
      return 'neutral'
  }
})
</script>

<style lang="scss" scoped>
.icon-only {
  :deep(.badge-content-wrapper) {
    display: none;
  }
}
</style>
