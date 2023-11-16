<template>
  <h2>Konnect API</h2>
  <KeyConfigCard
    :config="konnectConfig"
    :key-set-id="keySetId"
    @copy:success="onCopy"
    @fetch:error="onError"
    @fetch:success="onSuccess"
  />

  <h2>Kong Manager API</h2>
  <KeyConfigCard
    :config="kongManagerConfig"
    :key-set-id="keySetId"
    @copy:success="onCopy"
    @fetch:error="onError"
    @fetch:success="onSuccess"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectKeyEntityConfig, KongManagerKeyEntityConfig } from '../../src'
import { KeyConfigCard } from '../../src'
const props = defineProps({
  /** Grab the Key id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
// extract the keySetId from the route query
const keySetId = computed(() => {
  if (!router.currentRoute.value.query?.keySetId) {
    return null
  }

  return router.currentRoute.value.query?.keySetId as string
})

const konnectConfig = ref<KonnectKeyEntityConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId: props.id,
})
const kongManagerConfig = ref<KongManagerKeyEntityConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: props.id,
})
const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onSuccess = (payload: Record<string, any>) => {
  console.log('fetch:success', payload)
}
const onCopy = (payload: Record<string, any>) => {
  console.log('copy:success', payload)
}
</script>
