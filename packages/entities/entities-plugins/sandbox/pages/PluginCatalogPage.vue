<template>
  <div class="plugin-select-sandbox">
    <div class="sandbox-controls">
      <section class="custom-plugin-support-controls">
        <h3>Custom plugin support</h3>
        <KCheckbox
          v-model="supportInstalledCustomPlugin"
          :disabled="disableCustomPluginSupport"
          label="Installed custom plugins"
        />
        <KCheckbox
          v-model="supportStreamedCustomPlugin"
          :disabled="disableCustomPluginSupport"
          label="Streamed custom plugins"
        />
        <KCheckbox
          v-model="supportClonedPlugin"
          :disabled="disableCustomPluginSupport"
          label="Cloned plugins"
        />
        <KCheckbox
          v-model="disableCustomPluginSupport"
          label="Disabled"
        />
      </section>

      <section class="feature-flag-controls">
        <h3>Feature flags</h3>
        <KInputSwitch
          v-model="enableClonedPluginFeatureFlag"
          label="KM-2485 cloned plugins"
        />
      </section>

      <div class="permission-controls">
        <section>
          <h3>Custom plugin permissions</h3>
          <KInputSwitch
            v-model="allowReadCustomPlugin"
            label="Read custom plugins"
          />
          <KInputSwitch
            v-model="allowEditCustomPlugin"
            label="Edit custom plugins"
          />
          <KInputSwitch
            v-model="allowDeleteCustomPlugin"
            label="Delete custom plugins"
          />
        </section>

        <section>
          <h3>Cloned plugin permissions</h3>
          <KInputSwitch
            v-model="allowReadClonedPlugin"
            label="Read cloned plugins"
          />
          <KInputSwitch
            v-model="allowEditClonedPlugin"
            label="Edit cloned plugins"
          />
          <KInputSwitch
            v-model="allowDeleteClonedPlugin"
            label="Delete cloned plugins"
          />
        </section>
      </div>
    </div>

    <h2>Konnect API</h2>
    <PluginCatalog
      :key="catalogKey"
      :can-delete-cloned-plugin="canDeleteClonedPlugin"
      :can-delete-custom-plugin="canDeleteCustomPlugin"
      :can-edit-cloned-plugin="canEditClonedPlugin"
      :can-edit-custom-plugin="canEditCustomPlugin"
      :can-read-cloned-plugin="canReadClonedPlugin"
      :can-read-custom-plugin="canReadCustomPlugin"
      :config="konnectConfig"
      :custom-plugin-support="customPluginSupport"
      custom-plugins="disabled"
      :disabled-plugins="{ 'acl': 'ACL is not supported for this entity type' }"
      :highlighted-plugin-ids="highlightedPluginIds"
      @delete-custom:success="handleDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { KonnectPluginSelectConfig, CustomPluginSupportLevel, CustomPluginType } from '../../src'
import { FEATURE_FLAGS, PluginCatalog } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectPluginSelectConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      plugin,
    },
  }),
  // custom plugins
  createCustomRoute: { name: 'create-custom-plugin' },
  getCustomEditRoute: (plugin: string, type: CustomPluginType) => ({
    name: 'edit-custom-plugin',
    params: {
      control_plane_id: controlPlaneId.value,
      plugin,
      customPluginType: type,
    },
  }),
})

const highlightedPluginIds = ref([
  'basic-auth', 'ip-restriction', 'jwt', 'key-auth',
  'rate-limiting', 'request-termination', 'response-ratelimiting', 'tcp-log',
])

const supportInstalledCustomPlugin = ref(true)
const supportStreamedCustomPlugin = ref(true)
const supportClonedPlugin = ref(true)
const disableCustomPluginSupport = ref(false)
const enableClonedPluginFeatureFlag = ref(true)

const customPluginSupport = computed<CustomPluginSupportLevel>(() => {
  if (disableCustomPluginSupport.value) {
    return 'disabled'
  }

  const support: CustomPluginType[] = []
  if (supportInstalledCustomPlugin.value) {
    support.push('schema')
  }
  if (supportStreamedCustomPlugin.value) {
    support.push('streaming')
  }
  if (supportClonedPlugin.value) {
    support.push('cloned')
  }

  if (!support.length) {
    return 'none'
  }

  return support.length === 1 ? support[0] : support
})

const allowReadCustomPlugin = ref(true)
const allowEditCustomPlugin = ref(true)
const allowDeleteCustomPlugin = ref(true)
const allowReadClonedPlugin = ref(true)
const allowEditClonedPlugin = ref(true)
const allowDeleteClonedPlugin = ref(true)

const canReadCustomPlugin = async (): Promise<boolean> => allowReadCustomPlugin.value
const canEditCustomPlugin = async (): Promise<boolean> => allowEditCustomPlugin.value
const canDeleteCustomPlugin = async (): Promise<boolean> => allowDeleteCustomPlugin.value
const canReadClonedPlugin = async (): Promise<boolean> => allowReadClonedPlugin.value
const canEditClonedPlugin = async (): Promise<boolean> => allowEditClonedPlugin.value
const canDeleteClonedPlugin = async (): Promise<boolean> => allowDeleteClonedPlugin.value

const catalogKey = computed(() => JSON.stringify({
  customPluginSupport: customPluginSupport.value,
  enableClonedPluginFeatureFlag: enableClonedPluginFeatureFlag.value,
  permissions: {
    custom: [allowReadCustomPlugin.value, allowEditCustomPlugin.value, allowDeleteCustomPlugin.value],
    cloned: [allowReadClonedPlugin.value, allowEditClonedPlugin.value, allowDeleteClonedPlugin.value],
  },
}))

const handleDeleteSuccess = (plugin: string): void => {
  console.log(`Custom plugin ${plugin} deleted`)
}

provide(FEATURE_FLAGS.KM_2485_CLONED_PLUGINS, enableClonedPluginFeatureFlag)
</script>

<style lang="scss" scoped>
.plugin-select-sandbox {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;

  .sandbox-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 820px;
  }

  .permission-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
  }

  .custom-plugin-support-controls,
  .feature-flag-controls,
  .permission-controls section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 240px;

    h3 {
      font-size: 14px;
      margin: 0;
    }
  }
}
</style>
