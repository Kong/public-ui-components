<template>
  <h2>Konnect API</h2>
  <VaultConfigCard
    :config="konnectConfig"
    @fetch:error="onError"
    @fetch:success="onSuccess"
  />
  <SecretList
    v-if="konnectVaultRecord?.name === VaultProviders.KONNECT"
    :config="konnectConfigForSecret"
    :vault-id="id"
  />

  <h2>Kong Manager</h2>
  <VaultConfigCard
    :config="kongManagerConfig"
    @fetch:error="onError"
    @fetch:success="onSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { KongManagerVaultEntityConfig, KonnectVaultEntityConfig, KonnectSecretListConfig } from '../../src'
import { VaultProviders } from '../../src/types'
import VaultConfigCard from '../../src/components/VaultConfigCard.vue'
import SecretList from '../../src/components/SecretList.vue'
import type { AxiosError } from 'axios'
import { AppType } from '@kong-ui-public/entities-shared'

const props = defineProps({
  id: {
    type: String,
    required: false,
    default: '',
  },
})

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = ref<KonnectVaultEntityConfig>({
  app: AppType.Konnect,
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId: props.id,
})
const kongManagerConfig = ref<KongManagerVaultEntityConfig>({
  app: AppType.KongManager,
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: props.id,
})
const konnectConfigForSecret = ref<KonnectSecretListConfig>({
  app: AppType.Konnect,
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-secret', params: { vaultId: props.id } },
  isExactMatch: true,
  getEditRoute: (secretId: string) => ({
    name: 'edit-secret',
    params: {
      vaultId: props.id,
      secretId,
    },
  }),
})

const konnectVaultRecord = ref<Record<string, any>>()
const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onSuccess = (payload: Record<string, any>) => {
  konnectVaultRecord.value = payload
  console.log('fetch:success', payload)
}
</script>
