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

    <PluginSelectGroup
      v-if="!props.hideHighlightedPlugins && props.highlightedPlugins.length > 0"
      v-model="isHighlightedPluginsCollapsed"
      :config="config"
      :name="props.highlightedPluginsTitle ?? t('plugins.select.highlighted_plugins.title')"
      :navigate-on-click="navigateOnClick"
      :plugins="props.highlightedPlugins"
      :plugins-per-row="pluginsPerRow"
      @plugin-clicked="(plugin: PluginType) => emitPluginData(plugin)"
    />

    <template v-for="(group, idx) in PluginGroupArray">
      <div
        v-if="displayedPlugins[group]"
        :key="idx"
      >
        <PluginSelectGroup
          v-model="shouldCollapsed[group]"
          :config="config"
          :name="group"
          :navigate-on-click="navigateOnClick"
          :plugins="displayedPlugins[group as keyof PluginCardList] || []"
          :plugins-per-row="pluginsPerRow"
          @plugin-clicked="(plugin: PluginType) => emitPluginData(plugin)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import composables from '../../composables'
import {
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  PluginGroup,
  PluginGroupArray,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
  type PluginType,
} from '../../types'
import PluginSelectGroup from './PluginSelectGroup.vue'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginSelectConfig | KongManagerPluginSelectConfig>,
    required: true,
    validator: (config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.getCreateRoute) return false
      return true
    },
  },
  /**
   * Plugins to display in the grid
   */
  pluginList: {
    type: Object as PropType<PluginCardList>,
    default: () => ({}),
  },
  /**
   * @param {boolean} navigateOnClick if false, let consuming component handle event when clicking on a plugin
   * Used in conjunction with `@plugin-clicked` event
   */
  navigateOnClick: {
    type: Boolean,
    default: true,
  },
  /**
   * Number of plugins to always have visible (never will be collapsed)
   */
  pluginsPerRow: {
    type: Number,
    default: 4,
  },
  /**
   * List of plugins to show in the highlighted plugins group
   */
  highlightedPlugins: {
    type: Array as PropType<PluginType[]>,
    default: () => [],
  },
  /**
   * Title for the highlighted plugins group
   */
  highlightedPluginsTitle: {
    type: String,
    default: '',
  },
  /**
   * Whether or not to hide the highlighted plugins group
   */
  hideHighlightedPlugins: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void
}>()

const { i18n: { t } } = composables.useI18n()
const isHighlightedPluginsCollapsed = ref(false)
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
