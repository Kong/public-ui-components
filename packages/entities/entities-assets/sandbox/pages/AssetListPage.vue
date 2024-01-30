<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />

  <h2>Kong Manager API</h2>
  <AssetList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    @add:success="onAddSuccess"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete-route:success="onDeleteRouteSuccess"
    @error="onError"
    @remove:success="onRemoveSuccess"
  />
</template>

<script setup lang="ts">
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import type { AxiosError } from 'axios'
import { ref } from 'vue'
import { AssetList, type CopyEventPayload, type EntityRow, type KongManagerAssetListConfig } from '../../src'

const kongManagerConfig = ref<KongManagerAssetListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  paginatedEndpoint: true,
  createRoute: { name: 'create-asset' },
  getViewRoute: (id: string) => ({ name: 'view-asset', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-asset', params: { id } }),
  getCreatePluginRoute: (id: string) => ({ name: 'create-plugin', params: { assetId: id } }),
  filterSchema: {
    name: {
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

const onAddSuccess = (payload: string[]) => {
  console.log(`Successfully added ${payload.length} consumers`)
}

const onRemoveSuccess = () => {
  console.log('Successfully removed consumer')
}

const onCopyIdSuccess = (payload: CopyEventPayload) => {
  console.log(payload.message)
}

const onCopyIdError = (payload: CopyEventPayload) => {
  console.error(payload.message)
}

const onDeleteRouteSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
