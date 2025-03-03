<template>
  <h2>Konnect API</h2>
  <RedisConfigurationForm
    :config="konnectConfig"
    :partial-id="partialId"
    @error="onError"
    @update="onUpdate"
  />

  <h2>Kong Manager API</h2>
  <RedisConfigurationForm
    :config="kongManagerConfig"
    :partial-id="partialId"
    @error="onError"
    @update="onUpdate"
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
import { AppType } from '@kong-ui-public/entities-shared'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const partialId = computed((): string => route?.params?.id as string || '')

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: AppType.Konnect,
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}

const kongManagerConfig: KongManagerRedisConfigurationFormConfig = {
  app: AppType.KongManager,
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'redis-configuration-list' },
}

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (data: RedisConfigurationResponse) => {
  router.push({ name: 'view-redis-configuration', params: { id: data.id } })
}
</script>
