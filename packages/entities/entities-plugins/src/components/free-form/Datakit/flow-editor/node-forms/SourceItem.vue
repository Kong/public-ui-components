<template>
  <span class="dk-source-item">
    <component
      :is="getNodeVisual(item.type as NodeType).icon"
      :color="KUI_COLOR_TEXT_NEUTRAL"
      :size="KUI_ICON_SIZE_40"
    />
    {{ item.label }}
  </span>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import type { NodeType } from '../../types'
import type { InputOption } from '../composables/useNodeForm'
import { getNodeVisual } from '../node/node'

defineProps<{
  item: InputOption
}>()
</script>

<style lang="scss" scoped>
.dk-source-item {
  align-items: center;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>
