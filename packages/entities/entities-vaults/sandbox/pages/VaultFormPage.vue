<template>
  <h2>Konnect API</h2>
  <VaultForm
    :config="konnectConfig"
    :vault-id="vaultId"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <VaultForm
    :config="kongManagerConfig"
    :vault-id="vaultId"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectVaultFormConfig, KongManagerVaultFormConfig } from '../../src'
import { VaultForm } from '../../src'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const vaultId = computed((): string => route?.params?.id as string || '')

const konnectConfig = ref<KonnectVaultFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'vault-list' },
  azureVaultProviderAvailable: true,
  ttl: true,
  hcvAppRoleMethodAvailable: true,
  conjurVaultProviderAvailable: true,
})

const kongManagerConfig = ref<KongManagerVaultFormConfig>({
  app: 'kongManager',
  // Uncomment to test compatibility with different Gateway editions and versions
  // gatewayInfo: {
  //   edition: 'community',
  //   version: '3.3.0',
  // },
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'vault-list' },
  azureVaultProviderAvailable: false,
  ttl: true,
  hcvAppRoleMethodAvailable: true,
  awsStsEndpointUrlAvailable: true,
  conjurVaultProviderAvailable: true,
  base64FieldAvailable: true,
  hcvCertMethodAvailable: true,
  hcvJwtMethodAvailable: true,
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'vault-list' })
}
</script>
