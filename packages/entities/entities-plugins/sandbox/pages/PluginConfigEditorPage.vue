<template>
  <div class="plugin-config-editor-sandbox">
    <PluginConfigEditorLoader
      :metadata="PLUGIN_METADATA[pluginType]"
      :name="pluginType"
      :raw-gateway-schema="buildMockingSchema()"
    />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { FEATURE_FLAGS, TOASTER_PROVIDER } from '../../src'

import { ToastManager } from '@kong/kongponents'
import PluginConfigEditorLoader from '../../src/components/PluginConfigEditorLoader.vue'
import { PLUGIN_METADATA } from '../../src/definitions/metadata'
import { buildMockingSchema } from '../../fixtures/schemas/free-form-mocking'

const pluginType = 'basic-auth'
const toaster = new ToastManager()
provide(FEATURE_FLAGS.DATAKIT_ENABLE_FLOW_EDITOR, true)

provide(TOASTER_PROVIDER, toaster.open.bind(toaster))
</script>

<style lang="scss" scoped>
.plugin-config-editor-sandbox {
  padding: 20px;

  * {
    box-sizing: border-box;
  }
}
</style>
