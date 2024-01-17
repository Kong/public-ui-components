<template>
  <h2>Konnect API</h2>
  <KeyForm
    :config="konnectConfig"
    :key-id="id"
    :key-set-id="keySetId"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <KeyForm
    :config="kongManagerConfig"
    :key-id="id"
    :key-set-id="keySetId"
    @error="onError"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectKeyFormConfig, KongManagerKeyFormConfig } from '../../src'
import { KeyForm } from '../../src'

defineProps({
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

const konnectConfig = ref<KonnectKeyFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'key-list' },
  jsonYamlFormsEnabled: true,
})

const kongManagerConfig = ref<KongManagerKeyFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'key-list' },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'key-list' })
}
</script>
