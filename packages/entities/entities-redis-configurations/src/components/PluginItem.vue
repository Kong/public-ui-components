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
import { PluginIcon } from '@kong-ui-public/entities-plugins'

defineProps({
  pluginName: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.plugin-item {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}
</style>
