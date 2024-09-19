<template>
  <div class="plugin-select-sandbox">
    <!-- <h2>Konnect API</h2>
    <PluginSelect
      :config="konnectConfig"
      :disabled-plugins="{ 'acl': 'ACL is not supported for this entity type'}"
      :highlighted-plugin-ids="highlightedPluginIds"
      @delete-custom:success="handleDeleteSuccess"
    /> -->

    <h2>Kong Manager API</h2>
    <PluginSelect
      :config="kongManagerConfig"
      :highlighted-plugin-ids="highlightedPluginIds"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { KonnectPluginSelectConfig, KongManagerPluginSelectConfig } from '../../src'
import { PluginSelect } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectPluginSelectConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      plugin,
    },
  }),
  // custom plugins
  createCustomRoute: { name: 'create-custom-plugin' },
  getCustomEditRoute: (plugin: string) => ({
    name: 'edit-custom-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      plugin,
    },
  }),
})

const kongManagerConfig = ref<KongManagerPluginSelectConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc-i-lover-cats',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      plugin,
    },
  }),
})

const highlightedPluginIds = ref([
  'basic-auth', 'ip-restriction', 'jwt', 'key-auth',
  'rate-limiting', 'request-termination', 'response-ratelimiting', 'tcp-log',
])

const handleDeleteSuccess = (plugin: string): void => {
  console.log(`Custom plugin ${plugin} deleted`)
}
</script>

<style lang="scss" scoped>
.plugin-select-sandbox {
  padding: 20px;
}
</style>
