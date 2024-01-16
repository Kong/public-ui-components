<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <ConsumerGroupList
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
  <ConsumerGroupList
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
import { ConsumerGroupList } from '../../src'
import type { KonnectConsumerGroupListConfig, KongManagerConsumerGroupListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectConsumerGroupListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // Uncomment to test Consumer -> Consumer Groups
  // consumerId: '48211768-aaf8-44da-b1ba-1a8c388b0975',
  // consumerUsername: 'c-1',
  createRoute: { name: 'create-consumer-group' },
  getViewRoute: (id: string) => ({ name: 'view-consumer-group', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-consumer-group', params: { id } }),
})

const kongManagerConfig = ref<KongManagerConsumerGroupListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  paginatedEndpoint: true,
  // Uncomment to test Consumer -> Consumer Groups
  // consumerId: 'b20b1848-6640-4200-9102-73a184de976e',
  // consumerUsername: 'c-1',
  createRoute: { name: 'create-consumer-group' },
  getViewRoute: (id: string) => ({ name: 'view-consumer-group', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-consumer-group', params: { id } }),
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
  console.log(`Successfully added to ${payload.length} groups`)
}
const onRemoveSuccess = () => {
  console.log('Successfully exited from group')
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
