<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <!-- <h2>Konnect API</h2>
  <PluginList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-configure-dynamic-ordering="permissions.canEdit"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :can-toggle="permissions.canEdit"
    :config="konnectConfig"
    title="Plugins"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete-plugin:success="onDeletePluginSuccess"
    @error="onError"
  /> -->

  <h2>Kong Manager API</h2>
  <PluginList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-configure-dynamic-ordering="permissions.canEdit"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :can-toggle="permissions.canEdit"
    :config="kongManagerConfig"
    title="Plugins"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete-plugin:success="onDeletePluginSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import { PluginList } from '../../src'
import type { EntityRow, KongManagerPluginListConfig, KonnectPluginListConfig, CopyEventPayload, ViewRouteType } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectPluginListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'select-plugin' },
  getViewRoute: (plugin: EntityRow) => ({ name: 'view-plugin', params: { id: plugin.id, plugin: plugin.name } }),
  getEditRoute: (plugin: EntityRow) => ({ name: 'edit-plugin', params: { id: plugin.id, plugin: plugin.name } }),
  getScopedEntityViewRoute: (type: ViewRouteType, id: string) => ({ name: `view-${type}`, params: { id } }),
  getConfigureDynamicOrderingRoute: (plugin: EntityRow) => ({ name: 'configure-dynamic-ordering', params: { id: plugin.id } }),
})

const kongManagerConfig = ref<KongManagerPluginListConfig>({
  app: 'kongManager',
  // Uncomment to test compatibility with different Gateway editions and versions
  // gatewayInfo: {
  //   edition: 'community',
  //   version: '3.3.0',
  // },
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'select-plugin' },
  getViewRoute: (plugin: EntityRow) => ({ name: 'view-plugin', params: { id: plugin.id, plugin: plugin.name } }),
  getEditRoute: (plugin: EntityRow) => ({ name: 'edit-plugin', params: { id: plugin.id, plugin: plugin.name } }),
  getScopedEntityViewRoute: (type: ViewRouteType, id: string) => ({ name: `view-${type}`, params: { id } }),
  getConfigureDynamicOrderingRoute: (plugin: EntityRow) => ({ name: 'configure-dynamic-ordering', params: { id: plugin.id } }),
  filterSchema: {
    name: {
      type: 'text',
    },
    enabled: {
      type: 'select',
      values: ['true', 'false'],
    },
    instanceName: {
      type: 'text',
    },
  },
})

// Remount the tables in the sandbox when the permission props change; not needed outside of a sandbox
const key = ref(1)
const permissions = ref<PermissionsActions | null>(null)
const handlePermissionsUpdate = (newPermissions: PermissionsActions) => {
  permissions.value = newPermissions
  key.value++
}

const onCopyIdSuccess = (payload: CopyEventPayload) => {
  console.log(payload.message)
}

const onCopyIdError = (payload: CopyEventPayload) => {
  console.error(payload.message)
}

const onDeletePluginSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
