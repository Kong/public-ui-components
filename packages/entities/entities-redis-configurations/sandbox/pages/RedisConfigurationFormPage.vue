<template>
  <h2>Konnect API</h2>
  <RedisConfigurationForm
    :config="konnectConfig"
    :partial-id="partialId"
    @error="onError"
    @update="onUpdate"
    @updated="onUpdated"
  />

  <h2>Kong Manager API</h2>
  <RedisConfigurationForm
    :config="kongManagerConfig"
    :partial-id="partialId"
    @error="onError"
    @update="onUpdate"
    @updated="onUpdated"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { RedisConfigurationForm } from '../../src'
import type {
  KonnectRedisConfigurationFormConfig,
  KongManagerRedisConfigurationFormConfig,
  RedisConfigurationResponse,
} from '../../src'

import type { AxiosError } from 'axios'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const partialId = computed((): string => route?.params?.id as string || '')

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}

const kongManagerConfig: KongManagerRedisConfigurationFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'redis-configuration-list' },
}

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'redis-configuration-list' })
}

const onUpdated = (data: RedisConfigurationResponse) => {
  router.push({ name: 'view-redis-configuration', params: { id: data.id } })
}
</script>
