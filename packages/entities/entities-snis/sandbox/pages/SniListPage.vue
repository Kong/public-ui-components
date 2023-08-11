<template>
  <SandboxPermissionsControl
    :create-krn="patPermissions.create"
    :delete-krn="patPermissions.delete"
    :edit-krn="patPermissions.edit"
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <SniList
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
    @delete:success="onDeleteSNISuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <SniList
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
    @delete:success="onDeleteSNISuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import type { KonnectSniListConfig, KongManagerSniListConfig, EntityRow, CopyEventPayload } from '../../src'
import { SniList } from '../../src'
import SandboxPermissionsControl, { KonnectActions, KMActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectSniListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-sni' },
  getViewRoute: (id: string) => ({ name: 'view-sni', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-sni', params: { id } }),
})

const kongManagerConfig = ref<KongManagerSniListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-sni' },
  getViewRoute: (id: string) => ({ name: 'view-sni', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-sni', params: { id } }),
  filterSchema: {
    name: {
      type: 'text',
    },
  },
})

const patPermissions = {
  create: { service: 'konnect', action: '#create', resourcePath: `runtimegroups/${controlPlaneId}/snis/*` },
  delete: { service: 'konnect', action: '#delete', resourcePath: `runtimegroups/${controlPlaneId}/snis/*` },
  edit: { service: 'konnect', action: '#edit', resourcePath: `runtimegroups/${controlPlaneId}/snis/*` },
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

const onDeleteSNISuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
