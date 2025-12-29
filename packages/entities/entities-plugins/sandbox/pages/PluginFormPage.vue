<template>
  <div class="plugin-form-sandbox">
    <div
      id="plugin-form-page-actions"
      class="actions"
    />

    <h2>Konnect API</h2>
    <PluginForm
      :config="konnectConfig"
      enable-redis-partial
      enable-vault-secret-picker
      :engine="pluginFormEngine"
      :plugin-id="id"
      :plugin-type="plugin"
      use-custom-names-for-plugin
      @global-action="handleGlobalAction"
      @update="onUpdate"
    />

    <h2>Kong Manager API</h2>
    <PluginForm
      :config="kongManagerConfig"
      enable-redis-partial
      enable-vault-secret-picker
      :engine="pluginFormEngine"
      :plugin-id="id"
      :plugin-type="plugin"
      @global-action="handleGlobalAction"
      @update="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PluginForm, TOASTER_PROVIDER, useProvideExperimentalFreeForms } from '../../src'

import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../src'
import { ToastManager } from '@kong/kongponents'

import type { GlobalAction } from '../../src/components/free-form/shared/types'

const toaster = new ToastManager()

provide(TOASTER_PROVIDER, toaster.open.bind(toaster))

defineProps({
  /** Grab the plugin id and type from the route params */
  id: {
    type: String,
    default: '',
  },
  plugin: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const pluginFormEngine = import.meta.env.VITE_FORCE_PLUGIN_FORM_ENGINE || undefined

useProvideExperimentalFreeForms([
  'service-protection',
])

const konnectConfig = ref<KonnectPluginFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  cancelRoute: { name: 'list-plugin' },
  experimentalRenders: {
    keyAuthIdentityRealms: true,
  },
})

const kongManagerConfig = ref<KongManagerPluginFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc-i-lover-cats',
  cancelRoute: { name: 'list-plugin' },
})

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'list-plugin' })
}

const handleGlobalAction = (action: GlobalAction, payload: any) => {
  if (action === 'notify') {
    toaster.open(payload)
  }
}
</script>

<style lang="scss" scoped>
.plugin-form-sandbox {
  display: flex;
  flex-direction: column;
  padding: 20px;

  * {
    box-sizing: border-box;
  }

  .actions {
    align-self: flex-end;
  }
}
</style>
