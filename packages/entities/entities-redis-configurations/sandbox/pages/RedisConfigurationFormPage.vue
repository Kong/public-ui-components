<template>
  <h2>Konnect API</h2>
  <RedisConfigurationForm
    :config="konnectConfig"
  />
</template>

<script setup lang="ts">
import { RedisConfigurationForm } from '../../src'
import type { KonnectRedisConfigurationFormConfig } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}
</script>
