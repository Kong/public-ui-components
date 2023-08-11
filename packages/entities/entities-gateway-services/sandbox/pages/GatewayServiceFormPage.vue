<template>
  <h2>Konnect API</h2>
  <GatewayServiceForm
    :config="konnectConfig"
    :gateway-service-id="id"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <GatewayServiceForm
    :config="kongManagerConfig"
    :gateway-service-id="id"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectGatewayServiceFormConfig, KongManagerGatewayServiceFormConfig } from '../../src'
import { GatewayServiceForm } from '../../src'

defineProps({
  /** Grab the GatewayService id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = ref<KonnectGatewayServiceFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'gateway-services-list' },
})
const kongManagerConfig = ref<KongManagerGatewayServiceFormConfig>({
  app: 'kongManager',
  // Uncomment to test compatibility with different Gateway editions and versions
  // gatewayInfo: {
  //   edition: 'community',
  //   version: '3.3.0',
  // },
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'gateway-services-list' },
})
const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)
  router.push({ name: 'gateway-services-list' })
}
</script>
