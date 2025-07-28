<template>
  <KBadge
    :appearance="appearance"
    :class="{ 'condensed': condensed }"
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
import { USER_NODE_META_MAP, getNodeTypeName, isImplicitNodeType } from './node'
import type { BadgeAppearance } from '@kong/kongponents'

const { type } = defineProps<{
  type: NodeType
  condensed?: boolean
}>()

const icon = computed(() => {
  if (!isImplicitNodeType(type)) {
    return USER_NODE_META_MAP[type]?.icon ?? undefined
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
.condensed {
  padding: $kui-space-10;
}
</style>
