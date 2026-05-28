<template>
  <div class="plugin-select-sandbox">
    <div class="sandbox-controls">
      <div class="controls-section">
        <h4>Feature Flags</h4>
        <label>
          <input
            v-model="enableClonedPlugin"
            type="checkbox"
          > Enable Cloned Plugin
        </label>
        <label>
          <input
            v-model="enableStreamedPlugin"
            type="checkbox"
          > Enable Streamed Plugin
        </label>
        <label>
          <input
            v-model="showKmFeatured"
            type="checkbox"
          > KM Featured Group
        </label>
      </div>
      <div class="controls-section">
        <h4>RBAC — Cloned Plugin</h4>
        <label>
          <input
            v-model="canReadClonedPlugin"
            type="checkbox"
          > Read
        </label>
        <label>
          <input
            v-model="canUpdateClonedPlugin"
            type="checkbox"
          > Update
        </label>
        <label>
          <input
            v-model="canDeleteClonedPlugin"
            type="checkbox"
          > Delete
        </label>
      </div>
      <div class="controls-section">
        <h4>RBAC — Custom Plugin</h4>
        <label>
          <input
            v-model="canReadCustomPlugin"
            type="checkbox"
          > Read
        </label>
        <label>
          <input
            v-model="canUpdateCustomPlugin"
            type="checkbox"
          > Update
        </label>
        <label>
          <input
            v-model="canDeleteCustomPlugin"
            type="checkbox"
          > Delete
        </label>
      </div>
    </div>

    <h2>Konnect API</h2>
    <PluginCatalog
      :config="konnectConfig"
      custom-plugin-support="schema"
      custom-plugins="disabled"
      :disabled-plugins="{ 'acl': 'ACL is not supported for this entity type' }"
      :highlighted-plugin-ids="highlightedPluginIds"
      @delete-custom:success="handleDeleteSuccess"
    />

    <h2>Kong Manager API — streaming + cloned + schema</h2>
    <PluginCatalog
      :can-delete-cloned-plugin="canDeleteClonedPlugin"
      :can-delete-custom-plugin="canDeleteCustomPlugin"
      :can-read-cloned-plugin="canReadClonedPlugin"
      :can-read-custom-plugin="canReadCustomPlugin"
      :can-update-cloned-plugin="canUpdateClonedPlugin"
      :can-update-custom-plugin="canUpdateCustomPlugin"
      :config="kongManagerConfig"
      :custom-plugin-support="kmCustomPluginSupport"
      :highlighted-plugin-ids="highlightedPluginIds"
      :ignored-plugins="['acl']"
      :show-featured-group="showKmFeatured"
      @delete-custom:success="handleDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { KonnectPluginSelectConfig, KongManagerPluginSelectConfig, CustomPluginType } from '../../src'
import { PluginCatalog } from '../../src'
import { FEATURE_FLAGS } from '../../src/constants'

provide(FEATURE_FLAGS.KM_2485_CLONED_PLUGINS, true)

// Feature flag toggles
const enableClonedPlugin = ref(true)
const enableStreamedPlugin = ref(true)
const showKmFeatured = ref(false)

// RBAC toggles — Cloned/schema plugins (path: cloned-plugins)
const canReadClonedPlugin = ref(true)
const canUpdateClonedPlugin = ref(true)
const canDeleteClonedPlugin = ref(true)

// RBAC toggles — Streaming custom plugins (path: custom-plugins)
const canReadCustomPlugin = ref(true)
const canUpdateCustomPlugin = ref(true)
const canDeleteCustomPlugin = ref(true)

const kmCustomPluginSupport = computed(() => {
  const support: Array<'schema' | 'cloned' | 'streaming'> = ['schema']
  if (enableClonedPlugin.value) support.push('cloned')
  if (enableStreamedPlugin.value) support.push('streaming')
  return support
})

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
  getCustomEditRoute: (plugin: string, type: CustomPluginType) => ({
    name: 'edit-custom-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      plugin,
      customPluginType: type,
    },
  }),
})

const kongManagerConfig = ref<KongManagerPluginSelectConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // dev proxy: see vite.config.local.js
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: { plugin },
  }),
  createCustomRoute: { name: 'create-custom-plugin' },
  getCustomEditRoute: (plugin: string, type: CustomPluginType) => ({
    name: 'edit-custom-plugin',
    params: { plugin, customPluginType: type },
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
  position: relative;

  .sandbox-controls {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 16px;
    position: sticky;
    right: 0;
    top: 0;
    z-index: 10;

    .controls-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;

      h4 {
        font-size: 12px;
        font-weight: 600;
        margin: 0 0 4px;
        text-transform: uppercase;
      }

      label {
        align-items: center;
        cursor: pointer;
        display: flex;
        font-size: 13px;
        gap: 6px;
      }
    }
  }
}
</style>
