<template>
  <div class="kong-assets-form-wrapper">
    <h2>Kong Manager API</h2>
    <AssetForm
      :asset-id="id"
      :config="KMConfig"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />
  </div>
</template>

<script lang="ts" setup>
import AssetForm from '../../src/components/AssetForm.vue'
import { ref } from 'vue'
import type { KongManagerAssetFormConfig, KonnectAssetFormConfig } from '../../src'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'

const router = useRouter()

defineProps({
  /** Grab the Consumer id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectAssetFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api',
  controlPlaneId,
  cancelRoute: { name: 'asset-list' },
  jsonYamlFormsEnabled: true,
})

const KMConfig = ref<KongManagerAssetFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'asset-list' },
})

const onLoading = (val: boolean): void => {
  console.log(`Loading: ${val}`)
}

const onError = (val: AxiosError): void => {
  console.log(`Error: ${val}`)
}

const onUpdate = (val: Record<string, any>): void => {
  console.log(`Updated: ${val}`)
  router.push({ name: 'asset-list' })
}
</script>

<style lang="scss" scoped>
</style>
