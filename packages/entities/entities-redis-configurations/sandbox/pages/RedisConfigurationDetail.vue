<template>
  <h2>Konnect API</h2>
  <RedisConfigurationConfigCard
    :config="konnectConfig"
  />

  <h2>Kong Manager API</h2>
  <RedisConfigurationConfigCard
    :config="kongManagerConfig"
  />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

import { RedisConfigurationConfigCard } from '../../src'
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
} from '../../src'

const route = useRoute()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig: KonnectRedisConfigurationEntityConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
  entityId: route.params.id as string,
}

const kongManagerConfig: KongManagerRedisConfigurationEntityConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: route.params.id as string,
}

</script>
