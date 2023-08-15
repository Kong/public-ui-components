<template>
  <h2>Konnect API</h2>
  <SniForm
    :config="konnectConfig"
    :sni-id="id"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <SniForm
    :config="kongManagerConfig"
    :sni-id="id"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectSniFormConfig, KongManagerSniFormConfig } from '../../src'
import { SniForm } from '../../src'

defineProps({
  /** Grab the SNI id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectSniFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'snis-list' },
  // uncomment to see create with provided certificate
  /* certificateId: '1234-ilove-cats', */
})

const kongManagerConfig = ref<KongManagerSniFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'snis-list' },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'snis-list' })
}
</script>
