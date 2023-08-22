<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <ConsumerCredentialList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :config="konnectConfig"
    @copy:error="onCopyError"
    @copy:success="onCopySuccess"
    @delete:success="onDeleteSuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <ConsumerCredentialList
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
    @delete:success="onDeleteSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import type { AxiosError } from 'axios'
import { computed, ref } from 'vue'
import { ConsumerCredentialList } from '../../src'
import type { KonnectConsumerCredentialListConfig, KongManagerConsumerCredentialListConfig, EntityRow, CopyEventPayload, CredentialPlugins } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConsumerId = import.meta.env.VITE_KONNECT_CONSUMER_ID || ''
const kongManagerConsumerId = import.meta.env.VITE_KONG_MANAGER_CONSUMER_ID || ''

// For Konnect, the plugin should be one of `acls`, `basic-auth`, `key-auth`, `hmac-auth`, and `jwt`
// For Kong Manager, the plugin should be one of `acls`, `basic-auth`, `key-auth`, `key-auth-enc`, `oauth2`, `hmac-auth`, and `jwt`
const activePlugin = ref<CredentialPlugins>('basic-auth')

const konnectConfig = computed<KonnectConsumerCredentialListConfig>(() => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // Set the root `.env.development.local` variable to a consumer your PAT can access
  consumerId: konnectConsumerId,
  plugin: activePlugin.value,
  createRoute: { name: 'create-consumer-credential' },
  getEditRoute: (id: string) => ({ name: 'edit-consumer-credential', params: { id } }),
}))

const kongManagerConfig = computed<KongManagerConsumerCredentialListConfig>(() => ({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  // Set the root `.env.development.local` variable to a consumer your PAT can access
  consumerId: kongManagerConsumerId,
  plugin: activePlugin.value,
  createRoute: { name: 'create-consumer-credential' },
  getEditRoute: (id: string) => ({ name: 'edit-consumer-credential', params: { id } }),
}))

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

const onDeleteSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}
</script>
