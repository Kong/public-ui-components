<template>
  <div class="sandbox-container">
    <h2>Konnect API</h2>
    <UpstreamsConfigCard
      :config="konnectConfig"
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />
    <h2>Kong Manager API</h2>
    <UpstreamsConfigCard
      :config="kongManagerConfig"
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { KongManagerUpstreamsEntityConfig, KonnectUpstreamsEntityConfig } from '../../src'
import UpstreamsConfigCard from '../../src/components/UpstreamsConfigCard.vue'
import { useRoute } from 'vue-router'
import type { AxiosError } from 'axios'

const route = useRoute()
const id = computed((): string => route.params.id as string || '')

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = ref<KonnectUpstreamsEntityConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId: id.value,
})
const kongManagerConfig = ref<KongManagerUpstreamsEntityConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: id.value,
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onSuccess = (payload: Record<string, any>) => {
  console.log('fetch:success', payload)
}
</script>
