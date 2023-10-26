<template>
  <h2>Konnect API</h2>
  <PluginSelect
    :config="konnectConfig"
  />

  <h2>Kong Manager API</h2>
  <PluginSelect
    :config="kongManagerConfig"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../src'
import { PluginSelect } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

// Note: To try out scoping of plugins, append a query param to the end of the URL indicating the `entity_type`.
// Example: To see only plugins scoped to consumers, use
// `http://localhost:5173/plugin/select?entity_type=consumer_id`

const konnectConfig = ref<KonnectPluginFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      // TODO: is this right for KM?
      plugin,
    },
    /* query: {
      ...route.query,
    }, */
  }),
})

const kongManagerConfig = ref<KongManagerPluginFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      // TODO: is this right for KM?
      plugin,
    },
    // TODO:
    /*  query: {
      ...route.query,
    }, */
  }),
})
</script>
