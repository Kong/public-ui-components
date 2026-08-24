<template>
  <SandboxLayout
    :links="appLinks"
    title="Create Consumer & Credential"
  >
    <h2>Create consumer & credential ({{ plugin }})</h2>
    <CreateConsumerCredentialForm
      :config="konnectConfig"
      :credential-type="(plugin as CredentialType)"
      @cancel="onDone"
      @success="onDone"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { CreateConsumerCredentialForm } from '../../src'
import type { CredentialType, KonnectPluginFormConfig } from '../../src'

const { plugin } = defineProps<{ plugin: string }>()

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

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

