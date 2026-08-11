<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />

  <h2>Konnect API</h2>
  <RedisConfigurationList
    v-if="permissions"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="konnectConfig"
    enable-v2-empty-states
    @view-plugin="(id: string) => console.log('View plugin', id)"
  />

  <h2>Kong Manager API</h2>
  <RedisConfigurationList
    v-if="permissions"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    enable-v2-empty-states
    @view-plugin="(id: string) => console.log('View plugin', id)"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

import { RedisConfigurationList } from '../../src'

import type {
  KonnectRedisConfigurationListConfig,
  KongManagerRedisConfigurationListConfig,
} from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig: KonnectRedisConfigurationListConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  // Cloud Gateways add-ons API uses a non-geo base; CP/partials use apiBaseUrl
  cloudGatewaysApiBaseUrl: '/kong-api',
  controlPlaneId,
  createRoute: { name: 'create-redis-configuration' },
  getViewRoute: (id: string) => ({ name: 'view-redis-configuration', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-redis-configuration', params: { id } }),
  // Sandbox override for local testing: set true for managed-Redis copy, false for default copy
  isKonnectManagedRedisEnabled: true,
  // Combined list/add-ons flow is enabled only for Cloud Gateway control planes.
  isCloudGateway: true,
}

const kongManagerConfig: KongManagerRedisConfigurationListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  createRoute: { name: 'create-redis-configuration' },
  getViewRoute: (id: string) => ({ name: 'view-redis-configuration', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-redis-configuration', params: { id } }),
}

const permissions = ref<PermissionsActions | null>(null)

const handlePermissionsUpdate = (newPermissions: PermissionsActions) => {
  permissions.value = newPermissions
}
</script>
