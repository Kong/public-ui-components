<template>
  <div class="sandbox-container">
    <main>
      <div class="plugins-grid">
        <div
          v-for="plugin of plugins"
          :key="plugin"
          class="plugin-item"
        >
          <PluginIcon
            :name="plugin"
          />
          <div class="plugin-name">
            {{ plugin }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { PluginIcon } from '../src'
import { PLUGIN_GROUP_AND_SCOPE_MAP } from '@kong-ui-public/entities-plugins-metadata'

const plugins = Object.keys(PLUGIN_GROUP_AND_SCOPE_MAP).sort()
</script>

<style scoped>
.plugins-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  padding: 16px;
}

.plugin-item {
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  transition: all 0.3s ease;
}

.plugin-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.plugin-name {
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
}
</style>
