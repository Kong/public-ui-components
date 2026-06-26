<template>
  <p>Click <strong>+ New Redis</strong> in the dropdown to open the inline create panel.</p>
  <RedisConfigurationSelector
    v-model="selectedId"
    create-button-text="New Redis"
    :is-konnect-managed-redis-enabled="true"
  />
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { RedisConfigurationSelector } from '../../src'
import type { KonnectRedisConfigurationFormConfig } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const selectedId = ref<string>()

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
  isKonnectManagedRedisEnabled: true,
  isCloudGateway: true,
  cloudAuthAvailable: true,
}

provide(FORMS_CONFIG, konnectConfig)
</script>
