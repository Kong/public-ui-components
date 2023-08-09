<template>
  <SandboxPermissionsControl
    :create-krn="patPermissions.create"
    :delete-krn="patPermissions.delete"
    :edit-krn="patPermissions.edit"
    :retrieve-krn="patPermissions.retrieve"
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <ConsumerList
    v-if="konnectActions"
    :key="key"
    cache-identifier="konnect"
    :can-create="konnectActions.canCreate"
    :can-delete="konnectActions.canDelete"
    :can-edit="konnectActions.canEdit"
    :can-retrieve="konnectActions.canRetrieve"
    :config="konnectConfig"
    @add:success="onAddSuccess"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete-route:success="onDeleteRouteSuccess"
    @error="onError"
    @remove:success="onRemoveSuccess"
  />

  <h2>Kong Manager API</h2>
  <ConsumerList
    v-if="kmActions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="kmActions.canCreate"
    :can-delete="kmActions.canDelete"
    :can-edit="kmActions.canEdit"
    :can-retrieve="kmActions.canRetrieve"
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
import type { AxiosError } from 'axios'
import { ref } from 'vue'
import { ConsumerList } from '../../src'
import type { KonnectConsumerListConfig, KongManagerConsumerListConfig, EntityRow, CopyEventPayload } from '../../src'
import SandboxPermissionsControl, { KonnectActions, KMActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
// Uncomment to test Consumer Groups -> Consumers
// const consumerGroupId = 'fb9cb14b-efbf-463f-8f97-4a62a01a5363'
// const consumerGroupName = 'Group 1'

const konnectConfig = ref<KonnectConsumerListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // Uncomment to test Consumer Groups -> Consumers
  // consumerGroupId,
  // consumerGroupName,
  createRoute: { name: 'create-consumer' },
  getViewRoute: (id: string) => ({ name: 'view-consumer', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-consumer', params: { id } }),
})

const kongManagerConfig = ref<KongManagerConsumerListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-consumer' },
  // Uncomment to test Consumer Groups -> Consumers
  // consumerGroupId: '5ee03f9b-d93f-4c85-be77-144440c14dc8',
  // consumerGroupName: 'Group 1',
  getViewRoute: (id: string) => ({ name: 'view-consumer', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-consumer', params: { id } }),
  filterSchema: {
    username: {
      type: 'text',
    },
    custom_id: {
      type: 'text',
    },
  },
})

const patPermissions = {
  create: { service: 'konnect', action: '#create', resourcePath: `runtimegroups/${controlPlaneId}/consumers/*` },
  delete: { service: 'konnect', action: '#delete', resourcePath: `runtimegroups/${controlPlaneId}/consumers/*` },
  edit: { service: 'konnect', action: '#edit', resourcePath: `runtimegroups/${controlPlaneId}/consumers/*` },
  retrieve: { service: 'konnect', action: '#retrieve', resourcePath: `runtimegroups/${controlPlaneId}/consumers/*` },
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
