<template>
  <SandboxPermissionsControl
    :create-krn="patPermissions.create"
    :delete-krn="patPermissions.delete"
    :edit-krn="patPermissions.edit"
    :retrieve-krn="patPermissions.retrieve"
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <UpstreamsList
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
    @delete:success="onDeleteSuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <UpstreamsList
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
    @delete:success="onDeleteSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { UpstreamsList } from '../../src'
import { ref } from 'vue'
import type { KonnectUpstreamsListConfig, KongManagerUpstreamsListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { AxiosError } from 'axios'
import SandboxPermissionsControl, { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectUpstreamsListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-upstream' },
  // Enables navigation to upstreams config card
  getViewRoute: (id: string) => ({ name: 'config-upstream', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-upstream', params: { id } }),
})

const kongManagerConfig = ref<KongManagerUpstreamsListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-upstream' },
  // Enables navigation to upstreams config card
  getViewRoute: (id: string) => ({ name: 'config-upstream', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-upstream', params: { id } }),
  filterSchema: {
    name: {
      type: 'text',
    },
    slots: {
      type: 'text',
    },
  },
})

const patPermissions = {
  create: { service: 'konnect', action: '#create', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/*` },
  delete: { service: 'konnect', action: '#delete', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/*` },
  edit: { service: 'konnect', action: '#edit', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/*` },
  retrieve: { service: 'konnect', action: '#retrieve', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/*` },
}
// Remount the tables in the sandbox when the permission props change; not needed outside of a sandbox
const key = ref(1)
const permissions = ref<PermissionsActions | null>(null)

const handlePermissionsUpdate = (newPermissions : PermissionsActions) => {
  permissions.value = newPermissions
  key.value++
}

const onCopyIdSuccess = (payload: CopyEventPayload) => {
  console.log(payload.message)
}

const onCopyIdError = (payload: CopyEventPayload) => {
  console.error(payload.message)
}

const onDeleteSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
