<template>
  <h2>Konnect API</h2>
  <KeySetForm
    :config="konnectConfig"
    :key-set-id="id"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <KeySetForm
    :config="kongManagerConfig"
    :key-set-id="id"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectKeySetFormConfig, KongManagerKeySetFormConfig } from '../../src'
import { KeySetForm } from '../../src'
defineProps({
  /** Grab the Key Set id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = ref<KonnectKeySetFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'key-set-list' },
  jsonYamlFormsEnabled: true,
})
const kongManagerConfig = ref<KongManagerKeySetFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'key-set-list' },
})
const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)
  router.push({ name: 'key-set-list' })
}
</script>
