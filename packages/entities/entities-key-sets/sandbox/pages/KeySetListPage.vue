<template>
  <SandboxPermissionsControl
    :create-krn="patPermissions.create"
    :delete-krn="patPermissions.delete"
    :edit-krn="patPermissions.edit"
    :retrieve-krn="patPermissions.retrieve"
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <KeySetList
    v-if="konnectActions"
    :key="key"
    cache-identifier="konnect"
    :can-create="konnectActions.canCreate"
    :can-delete="konnectActions.canDelete"
    :can-edit="konnectActions.canEdit"
    :can-retrieve="konnectActions.canRetrieve"
    :config="konnectConfig"
    @copy:error="onCopyError"
    @copy:success="onCopySuccess"
    @delete:success="onDeleteKeySetSuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <KeySetList
    v-if="kmActions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="kmActions.canCreate"
    :can-delete="kmActions.canDelete"
    :can-edit="kmActions.canEdit"
    :can-retrieve="kmActions.canRetrieve"
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
import SandboxPermissionsControl, { KonnectActions, KMActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

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

const patPermissions = {
  create: { service: 'konnect', action: '#create', resourcePath: `runtimegroups/${controlPlaneId}/key-sets` },
  delete: { service: 'konnect', action: '#delete', resourcePath: `runtimegroups/${controlPlaneId}/key-sets/*` },
  edit: { service: 'konnect', action: '#edit', resourcePath: `runtimegroups/${controlPlaneId}/key-sets/*` },
  retrieve: { service: 'konnect', action: '#retrieve', resourcePath: `runtimegroups/${controlPlaneId}/key-sets/*` },
}
// Remount the tables in the sandbox when the permission props change; not needed outside of a sandbox
const key = ref(1)
const konnectActions = ref<KonnectActions | null>(null)
const kmActions = ref<KMActions | null>(null)
const handlePermissionsUpdate = (permissions: { konnect: KonnectActions, kongManager: KMActions }) => {
  konnectActions.value = permissions.konnect
  kmActions.value = permissions.kongManager
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
