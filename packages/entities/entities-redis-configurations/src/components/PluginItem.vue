<template>
  <div class="plugin-item">
    <PluginIcon
      :name="pluginName"
      :size="24"
    />
    <span>{{ pluginName }}</span>
  </div>
</template>

<script setup lang="ts">
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'

defineProps<{
  pluginName: string
}>()
</script>

<style lang="scss" scoped>
.plugin-item {
  align-items: center;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>
