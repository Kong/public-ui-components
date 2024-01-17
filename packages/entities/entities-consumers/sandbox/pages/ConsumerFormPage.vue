<template>
  <div class="kong-consumers-form-wrapper">
    <h2>Konnect API</h2>
    <ConsumerForm
      :config="konnectConfig"
      :consumer-id="id"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />

    <h2>Kong Manager API</h2>
    <ConsumerForm
      :config="KMConfig"
      :consumer-id="id"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />
  </div>
</template>

<script lang="ts" setup>
import ConsumerForm from '../../src/components/ConsumerForm.vue'
import { ref } from 'vue'
import type { KongManagerConsumerFormConfig, KonnectConsumerFormConfig } from '../../src'
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

const konnectConfig = ref<KonnectConsumerFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api',
  controlPlaneId,
  cancelRoute: { name: 'consumer-list' },
  jsonYamlFormsEnabled: true,
})

const KMConfig = ref<KongManagerConsumerFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'consumer-list' },
})

const onLoading = (val: boolean): void => {
  console.log(`Loading: ${val}`)
}

const onError = (val: AxiosError): void => {
  console.log(`Error: ${val}`)
}

const onUpdate = (val: Record<string, any>): void => {
  console.log(`Updated: ${val}`)
  router.push({ name: 'consumer-list' })
}
</script>

<style lang="scss" scoped>
</style>
