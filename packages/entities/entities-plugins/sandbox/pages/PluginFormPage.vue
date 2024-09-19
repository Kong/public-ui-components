<template>
  <div class="plugin-form-sandbox">
    <!-- <h2>Konnect API</h2>
    <PluginForm
      :config="konnectConfig"
      enable-vault-secret-picker
      :plugin-id="id"
      :plugin-type="plugin"
      use-custom-names-for-plugin
      @update="onUpdate"
    />

    <h2>Kong Manager API</h2> -->
    <PluginForm
      :config="kongManagerConfig"
      enable-vault-secret-picker
      :plugin-id="id"
      :plugin-type="plugin"
      @update="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../src'
import { PluginForm } from '../../src'

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

const konnectConfig = ref<KonnectPluginFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  cancelRoute: { name: 'list-plugin' },
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
</script>

<style lang="scss" scoped>
.plugin-form-sandbox {
  padding: 20px;
}
</style>
