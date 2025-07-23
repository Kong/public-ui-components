<template>
  <KBadge :appearance="appearance">
    <template #icon>
      <component :is="icon" />
    </template>
    {{ typeName }}
  </KBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeType, ExplicitNodeType } from '../../types'
import { NODE_META_MAP } from './node-meta'
import type { BadgeAppearance } from '@kong/kongponents'

const { type } = defineProps<{
  type: NodeType
}>()

const icon = computed(() => {
  return NODE_META_MAP[type as ExplicitNodeType]?.icon ?? undefined
})

const typeName = computed(() => NODE_META_MAP[type].label)

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
