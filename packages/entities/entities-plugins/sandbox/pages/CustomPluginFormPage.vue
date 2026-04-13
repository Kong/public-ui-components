<template>
  <div class="custom-plugin-form-sandbox">
    <h2>Custom Plugin Form (Konnect API)</h2>
    <CustomPluginForm
      :config="konnectConfig"
      @error="onError"
      @loading="onLoading"
      @update="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomPluginForm } from '../../src'
import type { CustomPluginFormConfig } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || 'abc-123-def'

const konnectConfig = ref<CustomPluginFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
  cancelRoute: { name: 'home' },
})

const onUpdate = (data: Record<string, any>) => {
  console.log('Form submitted:', data)
}

const onError = (error: Error) => {
  console.error('Form error:', error)
}

const onLoading = (isLoading: boolean) => {
  console.log('Loading:', isLoading)
}
</script>

<style lang="scss" scoped>
.custom-plugin-form-sandbox {
  max-width: 1200px;
  padding: 20px;
}
</style>
