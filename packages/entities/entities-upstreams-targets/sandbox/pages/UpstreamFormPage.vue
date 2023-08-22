<template>
  <div>
    <h2>Konnect API</h2>
    <UpstreamsForm
      :config="konnectConfig"
      :upstream-id="upstreamId"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />

    <h2>Kong Manager API</h2>
    <UpstreamsForm
      :config="KMConfig"
      :upstream-id="upstreamId"
      @error="onError($event)"
      @loading="onLoading($event)"
      @update="onUpdate($event)"
    />
  </div>
</template>

<script lang="ts" setup>
import UpstreamsForm from '../../src/components/UpstreamsForm.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import type { KongManagerUpstreamsFormConfig, KonnectUpstreamsFormConfig } from '../../src'
import type { AxiosError } from 'axios'

const route = useRoute()
const router = useRouter()

const upstreamId = computed((): string => route?.params?.id as string || '')

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectUpstreamsFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api',
  controlPlaneId,
  cancelRoute: { name: 'upstreams-list' },
})

const KMConfig = ref<KongManagerUpstreamsFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'upstreams-list' },
})

const onLoading = (val: boolean): void => {
  console.log(`Loading: ${val}`)
}

const onError = (val: AxiosError): void => {
  console.log(`Error: ${val}`)
}

const onUpdate = (val: Record<string, any>): void => {
  console.log(`Updated: ${val}`)
  router.push({ name: 'upstreams-list' })
}
</script>
