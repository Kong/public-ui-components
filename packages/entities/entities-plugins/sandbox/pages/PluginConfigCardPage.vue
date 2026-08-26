<template>
  <SandboxPage title="Plugin Config Card">
    <template #controls>
      <KInputSwitch
        v-model="showNameAsLink"
        label="Show scoped entities as links"
      />

      <KInputSwitch
        v-model="showScopeName"
        label="KM-2996: resolve scope names"
      />
    </template>

    <h2>Konnect API</h2>
    <PluginConfigCard
      :config="konnectConfig"
      enable-terraform
      :show-name-as-link="showNameAsLink"
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />

    <h2>Kong Manager API</h2>
    <PluginConfigCard
      :config="kongManagerConfig"
      :show-name-as-link="showNameAsLink"
      @fetch:error="onError"
      @fetch:success="onSuccess"
    />
  </SandboxPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import SandboxPage from '../SandboxPage.vue'
import type { KonnectPluginEntityConfig, KongManagerPluginEntityConfig } from '../../src'
import { PluginConfigCard } from '../../src'

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

const showNameAsLink = ref(true)
// KM-2996 rollout gate, lives on the config so flipping it re-renders the cards in place.
const showScopeName = ref(false)

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const konnectConfig = computed<KonnectPluginEntityConfig>(() => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId: props.id,
  pluginType: props.plugin,
  showScopeName: showScopeName.value,
  ...viewRoutes,
}))
const kongManagerConfig = computed<KongManagerPluginEntityConfig>(() => ({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: props.id,
  pluginType: props.plugin,
  showScopeName: showScopeName.value,
  ...viewRoutes,
}))

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}
const onSuccess = (payload: Record<string, any>) => {
  console.log('fetch:success', payload)
}
</script>
