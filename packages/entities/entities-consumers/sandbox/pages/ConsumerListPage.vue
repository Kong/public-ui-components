<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <ConsumerList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
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
import type { AxiosError } from 'axios'
import { ref } from 'vue'
import { ConsumerList } from '../../src'
import type { KonnectConsumerListConfig, KongManagerConsumerListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
// Uncomment to test Consumer Groups -> Consumers
// const consumerGroupId = 'fb9cb14b-efbf-463f-8f97-4a62a01a5363'
// const consumerGroupName = 'Group 1'

const konnectConfig = ref<KonnectConsumerListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/konnect-v2',
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
  consumerGroupId: '0de87974-352c-4054-8969-238cdd82a57f',
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
