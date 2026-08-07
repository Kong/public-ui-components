<template>
  <div class="onboarding-flow-sandbox">
    <h2>Add consumer & credential ({{ plugin }})</h2>
    <AddCredentialToConsumerForm
      :config="konnectConfig"
      :credential-type="(plugin as CredentialType)"
      @cancel="onDone"
      @success="onDone"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AddCredentialToConsumerForm } from '../../src'
import type { CredentialType, KonnectPluginFormConfig } from '../../src'


const { plugin } = defineProps<{ plugin: string }>()

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = computed<KonnectPluginFormConfig>(() => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
}))

const onDone = (payload?: unknown) => {
  console.log('done', payload)
  router.push({ name: 'auth-plugin-onboarding-card' })
}
</script>

<style lang="scss" scoped>
.onboarding-flow-sandbox {
  padding: 20px;
}
</style>
