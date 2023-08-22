<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <GatewayServiceList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="konnectConfig"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete:success="onDeleteGatewayServiceSuccess"
    @error="onError"
    @toggle:success="onToggleGatewayServiceSuccess"
  />

  <h2>Kong Manager API</h2>
  <GatewayServiceList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete:success="onDeleteGatewayServiceSuccess"
    @error="onError"
    @toggle:success="onToggleGatewayServiceSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import type { KonnectGatewayServiceListConfig, KongManagerGatewayServiceListConfig, EntityRow, CopyEventPayload } from '../../src'
import { GatewayServiceList } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectGatewayServiceListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-gateway-service' },
  getViewRoute: (id: string) => ({ name: 'view-gateway-service', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-gateway-service', params: { id } }),
})

const kongManagerConfig = ref<KongManagerGatewayServiceListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-gateway-service' },
  getViewRoute: (id: string) => ({ name: 'view-gateway-service', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-gateway-service', params: { id } }),
  filterSchema: {
    name: {
      type: 'text',
    },
    protocols: {
      type: 'text',
    },
    hosts: {
      type: 'text',
    },
    methods: {
      type: 'text',
    },
    paths: {
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

const onDeleteGatewayServiceSuccess = (row: EntityRow) => {
  console.log(`${row.name || row.id} successfully deleted`)
}

const onToggleGatewayServiceSuccess = (row: EntityRow) => {
  const action: string = !row.enabled ? 'enabled' : 'disabled'

  console.log(`${row.name || row.id} successfully ${action}`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
