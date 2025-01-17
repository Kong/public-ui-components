<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />

  <h2>Konnect API</h2>
  <RedisConfigurationList
    :config="konnectConfig"
  />

  <h2>Kong Manager API</h2>
  <RedisConfigurationList
    :config="kongManagerConfig"
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
  controlPlaneId,
  createRoute: { name: 'create-redis-configuration' },
  getViewRoute: (id: string) => ({ name: 'view-redis-configuration', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-redis-configuration', params: { id } }),
}

const kongManagerConfig: KongManagerRedisConfigurationListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  createRoute: { name: 'create-redis-configuration' },
  getViewRoute: (id: string) => ({ name: 'view-redis-configuration', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-redis-configuration', params: { id } }),
}

// Remount the tables in the sandbox when the permission props change; not needed outside of a sandbox
const key = ref(1)
const permissions = ref<PermissionsActions | null>(null)

const handlePermissionsUpdate = (newPermissions: PermissionsActions) => {
  permissions.value = newPermissions
  key.value++
}
</script>
