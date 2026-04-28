<template>
  <div class="custom-plugin-form-sandbox">
    <div>
      <h2>{{ isEditing ? 'Edit' : 'Create' }} Custom Plugin Form (Konnect API)</h2>
      <CustomPluginForm
        :config="konnectConfig"
        :plugin-name="pluginName"
      />
    </div>
    <div>
      <h2>{{ isEditing ? 'Edit' : 'Create' }} Custom Plugin Form (Kong Manager API)</h2>
      <KAlert>
        Kong Manager does not support installed custom plugins
      </KAlert>
      <CustomPluginForm
        :config="kongManagerConfig"
        :plugin-name="pluginName"
        :unsupported-types="['installed']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { CustomPluginForm } from '../../src'
import type { KongManagerCustomPluginFormConfig, KonnectCustomPluginFormConfig } from '../../src'

const route = useRoute()

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || 'abc-123-def'

const pluginName = computed(() => String(route.params.plugin || ''))

const isEditing = computed(() => !!pluginName.value)

const konnectConfig: KonnectCustomPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
  cancelRoute: { name: 'select-plugin', hash: '#custom' },
  successRoute: { name: 'select-plugin', hash: '#custom' },
}

const kongManagerConfig: KongManagerCustomPluginFormConfig = {
  app: 'kongManager',
  apiBaseUrl: '/kong-manager',
  workspace: 'default',
  cancelRoute: { name: 'select-plugin', hash: '#custom' },
  successRoute: { name: 'select-plugin', hash: '#custom' },
}

</script>

<style lang="scss" scoped>
.custom-plugin-form-sandbox {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 1536px;
  padding: 20px;
}
</style>
