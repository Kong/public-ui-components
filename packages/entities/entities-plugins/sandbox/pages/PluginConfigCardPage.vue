<template>
  <SandboxLayout
    :links="appLinks"
    title="Plugin Config Card"
  >
    <h2>Konnect API</h2>
    <PluginConfigCard
      :config="konnectConfig"
      enable-terraform
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />

    <h2>Kong Manager API</h2>
    <PluginConfigCard
      :config="kongManagerConfig"
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import type { AxiosError } from 'axios'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import type { KonnectPluginEntityConfig, KongManagerPluginEntityConfig } from '../../src'
import { PluginConfigCard } from '../../src'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const props = defineProps({
  /** Grab the Plugin type & id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
  plugin: {
    type: String,
    required: false,
    default: '',
  },
})

const viewRoutes = {
  getServiceViewRoute: (id: string) => ({ name: 'view-service', params: { id } }),
  getRouteViewRoute: (id: string) => ({ name: 'view-route', params: { id } }),
  getConsumerViewRoute: (id: string) => ({ name: 'view-consumer', params: { id } }),
  getConsumerGroupViewRoute: (id: string) => ({ name: 'view-consumer_group', params: { id } }),
}

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = ref<KonnectPluginEntityConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId: props.id,
  pluginType: props.plugin,
  ...viewRoutes,
})
const kongManagerConfig = ref<KongManagerPluginEntityConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: props.id,
  pluginType: props.plugin,
  ...viewRoutes,
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onSuccess = (payload: Record<string, any>) => {
  console.log('fetch:success', payload)
}
</script>
