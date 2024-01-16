<template>
  <h2>Konnect API</h2>
  <CACertificateForm
    :certificate-id="id"
    :config="konnectConfig"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <CACertificateForm
    :certificate-id="id"
    :config="kongManagerConfig"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectCertificateFormConfig, KongManagerCertificateFormConfig } from '../../src'
import { CACertificateForm } from '../../src'

defineProps({
  /** Grab the Certificate id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectCertificateFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'ca-certificate-list' },
  jsonYamlFormsEnabled: true,
})

const kongManagerConfig = ref<KongManagerCertificateFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'ca-certificate-list' },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'ca-certificate-list' })
}
</script>
