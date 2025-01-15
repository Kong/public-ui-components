<template>
  <template v-if="false">
    <h2>Konnect API</h2>
    <RedisConfigurationForm
      :config="konnectConfig"
    />
  </template>

  <h2>Kong Manager API</h2>
  <RedisConfigurationForm
    :config="kongManagerConfig"
  />
</template>

<script setup lang="ts">
import { RedisConfigurationForm } from '../../src'
import type {
  KonnectRedisConfigurationFormConfig,
  KongManagerRedisConfigurationFormConfig,
} from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}

const kongManagerConfig: KongManagerRedisConfigurationFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'home' },
}
</script>
