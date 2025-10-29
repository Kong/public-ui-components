<template>
  <span class="dk-source-item">
    <component
      :is="NODE_VISUAL[item.type as NodeType].icon"
      :color="NODE_VISUAL[item.type as NodeType].colors?.foreground"
      :size="KUI_ICON_SIZE_40"
    />
    {{ item.label }}
  </span>
</template>

<script setup lang="ts">
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import type { NodeType } from '../../types'
import type { InputOption } from '../composables/useNodeForm'
import { NODE_VISUAL } from '../node/node-visual'

defineProps<{
  item: InputOption
}>()
</script>

<style lang="scss" scoped>
.dk-source-item {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}
</style>
