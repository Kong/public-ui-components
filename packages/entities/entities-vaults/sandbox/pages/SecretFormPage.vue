<template>
  <h2>Konnect API</h2>
  <SecretForm
    :config="konnectConfig"
    :secret-id="secretId"
    :vault-id="vaultId"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectSecretFormConfig } from '../../src'
import { SecretForm } from '../../src'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const vaultId = computed((): string => route?.params?.vaultId as string || '')
const secretId = computed((): string => route?.params?.secretId as string || '')

const konnectConfig = ref<KonnectSecretFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'view-vault', params: { id: vaultId.value } },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'view-vault', params: { id: vaultId.value } })
}
</script>
