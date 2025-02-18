<template>
  <div class="linked-plugins">
    <PluginIcon
      name="rate-limiting-advanced"
      :size="24"
    />
    <PluginIcon
      name="rate-limiting"
      :size="24"
    />
    <KBadge appearance="info">
      +5
    </KBadge>
  </div>
</template>

<script setup lang="ts">
import { PluginIcon } from '@kong-ui-public/entities-plugins'

</script>


<style scoped lang="scss">
.linked-plugins {
  display: flex;
  gap: $kui-space-40;
}
</style>
