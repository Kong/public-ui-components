<template>
  <h2>Konnect API</h2>
  <KButton @click="konnectModalVisible = true">
    Create Redis Configuration
  </KButton>

  <h2>Kong Manager API</h2>
  <KButton @click="kmModalVisible = true">
    Create Redis Configuration
  </KButton>

  <KModal
    full-screen
    :visible="konnectModalVisible"
    @cancel="konnectModalVisible = false"
    @proceed="konnectModalVisible = false"
  >
    <RedisConfigurationForm
      :config="konnectConfig"
      :partial-id="partialId"
      @error="onError"
      @update="onUpdate"
      @updated="onUpdated"
    />
  </KModal>

  <KModal
    full-screen
    :visible="kmModalVisible"
    @cancel="kmModalVisible = false"
    @proceed="kmModalVisible = false"
  >
    <RedisConfigurationForm
      :config="kongManagerConfig"
      :partial-id="partialId"
      @error="onError"
      @update="onUpdate"
      @updated="onUpdated"
    />
  </KModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

const konnectModalVisible = ref(false)
const kmModalVisible = ref(false)

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
