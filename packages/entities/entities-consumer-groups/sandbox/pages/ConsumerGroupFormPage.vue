<template>
  <div>
    <h2>Konnect API</h2>
    <ConsumerGroupForm
      :config="konnectConfig"
      :consumer-group-id="id"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />

    <h2>Kong Manager API</h2>
    <ConsumerGroupForm
      :config="KMConfig"
      :consumer-group-id="id"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />
  </div>
</template>

<script lang="ts" setup>
import ConsumerGroupForm from '../../src/components/ConsumerGroupForm.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import type { KongManagerConsumerGroupFormConfig, KonnectConsumerGroupFormConfig } from '../../src'
import type { AxiosError } from 'axios'

const router = useRouter()

defineProps({
  /** Grab the ConsumerGroup id from the route params */
  id: {
    type: String,
    required: false,
    default: '',
  },
})

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectConsumerGroupFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api',
  controlPlaneId,
  cancelRoute: { name: 'consumer-group-list' },
  jsonYamlFormsEnabled: true,
})

const KMConfig = ref<KongManagerConsumerGroupFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'consumer-group-list' },
})

const onLoading = (val: boolean): void => {
  console.log(`Loading: ${val}`)
}

const onError = (val: AxiosError): void => {
  console.log(`Error: ${val}`)
}

const onUpdate = (val: Record<string, any>): void => {
  console.log(`Updated: ${val}`)
  router.push({ name: 'consumer-group-list' })
}
</script>

<style scoped>

</style>
