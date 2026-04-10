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

/**
 * Konnect-managed redis UI (Cache configuration + optional partial collapse) only appears when ALL of the following are true:
 * `isKonnectManagedRedisEnabled: true` and `isCloudGateway: true`
 * `cloudGatewaysApiBaseUrl`/`apiBaseUrl` must reach Konnect’s Cloud Gateways add-ons API (`/v2/cloud-gateways/add-ons/...`)
 * After mount, the resolver finds a managed-cache add-on for `entityId` (or a partial and linked add-on). Otherwise UI stays on the legacy partial-only card
 */
const konnectConfig: KonnectRedisConfigurationEntityConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  cloudGatewaysApiBaseUrl: '/kong-api',
  controlPlaneId,
  entityId: route.params.id as string,
  formatPreferenceKey: 'redis_configuration_format_preference',
  isKonnectManagedRedisEnabled: true,
  isCloudGateway: true,
}

const kongManagerConfig: KongManagerRedisConfigurationEntityConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId: route.params.id as string,
  cloudAuthAvailable: true,
}

</script>
