<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <KeySetList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="konnectConfig"
    @copy:error="onCopyError"
    @copy:success="onCopySuccess"
    @delete:success="onDeleteKeySetSuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <KeySetList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    @copy:error="onCopyError"
    @copy:success="onCopySuccess"
    @delete:success="onDeleteKeySetSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import { KeySetList } from '../../src'
import type { KonnectKeySetListConfig, KongManagerKeySetListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectKeySetListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-key-set' },
  getViewRoute: (id: string) => ({ name: 'view-key-set', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-key-set', params: { id } }),
})

const kongManagerConfig = ref<KongManagerKeySetListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-key-set' },
  getViewRoute: (id: string) => ({ name: 'view-key-set', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-key-set', params: { id } }),
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

const onCopySuccess = (payload: CopyEventPayload) => {
  console.log(payload.message)
}

const onCopyError = (payload: CopyEventPayload) => {
  console.error(payload.message)
}

const onDeleteKeySetSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
