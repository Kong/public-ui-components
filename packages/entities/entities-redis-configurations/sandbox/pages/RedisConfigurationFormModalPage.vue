<template>
  <h2>Konnect API</h2>
  <KButton @click="handleKonnectModalOpen">
    Create Redis Configuration
  </KButton>

  <h2>Kong Manager API</h2>
  <KButton @click="handleKMModalOpen">
    Create Redis Configuration
  </KButton>

  <KModal
    full-screen
    :visible="konnectModalVisible"
    @cancel="handleKonnectModalClose"
    @proceed="handleKonnectModalClose"
  >
    <RedisConfigurationForm
      :action-teleport-target="konnectModalActionTeleportTarget"
      :config="konnectConfig"
      :partial-id="partialId"
      :slidout-top-offset="0"
      @error="onError"
      @update="onUpdate"
      @updated="onUpdated"
    />
    <template #footer>
      <div id="konnect-modal-footer" />
    </template>
  </KModal>

  <KModal
    full-screen
    :visible="kmModalVisible"
    @cancel="handleKMModalClose"
    @proceed="handleKMModalClose"
  >
    <RedisConfigurationForm
      :action-teleport-target="kmModalActionTeleportTarget"
      :config="kongManagerConfig"
      :partial-id="partialId"
      :slidout-top-offset="0"
      @cancel="handleKMModalClose"
      @error="onError"
      @update="onUpdate"
      @updated="onUpdated"
    />
    <template #footer>
      <div id="km-modal-footer" />
    </template>
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
import { nextTick } from 'process'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const partialId = computed((): string => route?.params?.id as string || '')

const konnectModalVisible = ref(false)
const kmModalVisible = ref(false)

const konnectModalActionTeleportTarget = ref<string>()
const kmModalActionTeleportTarget = ref<string>()

const konnectConfig: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}

const kongManagerConfig: KongManagerRedisConfigurationFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
}

const handleKMModalOpen = () => {
  kmModalVisible.value = true
  nextTick(() => {
    kmModalActionTeleportTarget.value = '#km-modal-footer'
  })
}

const handleKMModalClose = () => {
  kmModalActionTeleportTarget.value = undefined
  nextTick(() => {
    kmModalVisible.value = false
  })
}

const handleKonnectModalOpen = () => {
  konnectModalVisible.value = true
  nextTick(() => {
    konnectModalActionTeleportTarget.value = '#konnect-modal-footer'
  })
}

const handleKonnectModalClose = () => {
  konnectModalActionTeleportTarget.value = undefined
  nextTick(() => {
    konnectModalVisible.value = false
  })
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

<style>
#konnect-modal-footer, #km-modal-footer {
  width: 100%;
}
</style>
