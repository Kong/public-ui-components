<template>
  <h2>Konnect API</h2>
  <RedisConfigurationForm
    :config="konnectConfig"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RedisConfigurationForm } from '../../src'
import type { KonnectRedisConfigurationFormConfig } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectRedisConfigurationFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/use/kong-api',
  controlPlaneId,
  cancelRoute: { name: 'home' },
})
</script>
