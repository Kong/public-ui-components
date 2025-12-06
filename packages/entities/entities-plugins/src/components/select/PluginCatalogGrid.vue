<template>
  <div class="plugin-select-grid">
    <KEmptyState
      v-if="!Object.keys(displayedPlugins).length"
      :action-button-visible="false"
      class="plugins-empty-state"
      data-testid="plugins-empty-state"
      icon-variant="kong"
    >
      <!-- this will only be shown if there are no existing Kong plugins -->
      <template #title>
        <span class="empty-state-title">
          {{ t('plugins.select.tabs.kong.empty_title') }}
        </span>
      </template>

      <template #default>
        <span class="empty-state-description">
          {{ t('plugins.select.tabs.kong.empty_description') }}
        </span>
      </template>
    </KEmptyState>

    <template v-for="group in displayGroups">
      <div
        v-if="displayedPlugins[group]"
        :key="group"
      >
        <PluginCatalogGroup
          v-model="shouldCollapsed[group]"
          :config="config"
          :name="group"
          :plugins="displayedPlugins[group as keyof PluginCardList] || []"
          @plugin-clicked="(plugin: PluginType) => emitPluginData(plugin)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../../composables'
import {
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  PluginGroup,
  PluginFeaturedArray,
  PluginGroupArray,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
  type PluginType,
} from '../../types'
import PluginCatalogGroup from './PluginCatalogGroup.vue'

const props = defineProps<{
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  /**
   * Plugins to display in the grid
   */
  pluginList?: PluginCardList
}>()

const displayGroups = PluginFeaturedArray.concat(PluginGroupArray)

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void
}>()

const { i18n: { t } } = composables.useI18n()
const shouldCollapsed = ref<Record<string, boolean>>(PLUGIN_GROUPS_COLLAPSE_STATUS)

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

const displayedPlugins = computed((): PluginCardList => {
  const kongPlugins = JSON.parse(JSON.stringify(props.pluginList))

  // remove custom plugin from original pluginList in Konnect
  if (props.config.app === 'konnect') {
    delete kongPlugins[PluginGroup.CUSTOM_PLUGINS]
  }

  return kongPlugins as PluginCardList
})
</script>

<style lang="scss" scoped>
.plugin-select-grid {
  display: flex;
  flex-direction: column;
  gap: $kui-space-110;
}
</style>
