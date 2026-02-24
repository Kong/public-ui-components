<template>
  <div class="plugin-select-grid">
    <KEmptyState
      v-if="!Object.keys(pluginList || []).length"
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
        v-if="pluginList?.[group]"
        :key="group"
      >
        <PluginCatalogGroup
          v-model="shouldCollapsed[group]"
          :config="config"
          :name="group"
          :plugins="pluginList[group as keyof PluginCardList] || []"
          @delete:success="(pluginName: string) => emit('delete:success', pluginName)"
          @plugin-clicked="(plugin: PluginType) => emitPluginData(plugin)"
        />
      </div>
    </template>
    <div v-if="pluginList?.['Query Result']?.length">
      <PluginCatalogGroup
        v-model="shouldCollapsed['Query Result']"
        :config="config"
        :plugins="pluginList['Query Result'] || []"
        show-all-card
        @plugin-clicked="(plugin: PluginType) => emitPluginData(plugin)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import composables from '../../composables'
import {
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  PluginFeaturedArray,
  PluginGroupArraySortedAlphabetically,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
  type PluginType,
} from '../../types'
import PluginCatalogGroup from './PluginCatalogGroup.vue'

defineProps<{
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  /**
   * Plugins to display in the grid
   */
  pluginList?: PluginCardList
}>()

const displayGroups = PluginFeaturedArray.concat(PluginGroupArraySortedAlphabetically)

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void
  (e: 'delete:success', pluginName: string): void
}>()

const { i18n: { t } } = composables.useI18n()
const shouldCollapsed = ref<Record<string, boolean>>(PLUGIN_GROUPS_COLLAPSE_STATUS)

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}
</script>

<style lang="scss" scoped>
.plugin-select-grid {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-110, $kui-space-110);
}
</style>
