<template>
  <h2>Konnect API</h2>
  <RouteForm
    :config="konnectConfig"
    :route-id="routeId"
    @error="onError"
    @update="onUpdate"
  >
    <template #form-actions="{ canSubmit, submit, cancel }">
      <KButton
        appearance="outline"
        @click="cancel"
      >
        Cancel
      </KButton>
      <KButton
        appearance="primary"
        :disabled="!canSubmit"
        @click="submit"
      >
        Next
      </KButton>
    </template>
  </RouteForm>

  <h2>Kong Manager API</h2>
  <RouteForm
    :config="kongManagerConfig"
    :route-id="routeId"
    @error="onError"
    @update="onUpdate"
  >
    <template #form-actions="{ canSubmit, submit, cancel }">
      <KButton
        appearance="outline"
        @click="cancel"
      >
        Cancel
      </KButton>
      <KButton
        appearance="primary"
        :disabled="!canSubmit"
        @click="submit"
      >
        Next
      </KButton>
    </template>
  </RouteForm>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectRouteFormConfig, KongManagerRouteFormConfig } from '../../src'
import { RouteForm } from '../../src'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const routeId = computed((): string => route?.params?.id as string || '')

const konnectConfig = ref<KonnectRouteFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'route-list' },
})

const kongManagerConfig = ref<KongManagerRouteFormConfig>({
  app: 'kongManager',
  // Uncomment to test compatibility with different Gateway editions and versions
  // gatewayInfo: {
  //   edition: 'community',
  //   version: '3.3.0',
  // },
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'route-list' },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'route-list' })
}
</script>
