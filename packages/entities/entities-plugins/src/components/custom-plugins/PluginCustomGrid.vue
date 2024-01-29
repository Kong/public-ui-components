<template>
  <div class="custom-plugins-grid">
    <KEmptyState
      v-if="!modifiedCustomPlugins.length"
      class="custom-plugins-empty-state"
      cta-is-hidden
      icon="stateGruceo"
      icon-size="96"
    >
      <!-- this will only be shown if not allowed to create custom plugins -->
      <template #title>
        <span class="empty-state-title">
          {{ !streamingPlugins ? t('plugins.select.tabs.custom.empty_title') :
            t('plugins.select.tabs.streaming.empty_title') }}
        </span>
      </template>

      <template #message>
        <span class="empty-state-description">
          {{ !streamingPlugins ? t('plugins.select.tabs.custom.empty_description') :
            t('plugins.select.tabs.streaming.empty_description') }}
        </span>
      </template>
    </KEmptyState>

    <KCollapse
      v-else
      v-model="shouldCollapsedCustomPlugins"
      class="custom-plugins-collapse"
      :data-testid="`${PluginGroup.CUSTOM_PLUGINS}-collapse`"
      :title="!props.streamingPlugins ? PluginGroup.CUSTOM_PLUGINS : PluginGroup.STREAMING_PLUGINS"
      :trigger-label="triggerLabel"
    >
      <!-- don't display a trigger if all plugins will already be visible -->
      <template
        v-if="modifiedCustomPlugins.length <= pluginsPerRow"
        #trigger
      >
        &nbsp;
      </template>
      <template #visible-content>
        <div class="plugin-card-container">
          <PluginSelectCard
            v-for="(plugin, index) in getPluginCards('visible', modifiedCustomPlugins, pluginsPerRow)"
            :key="`plugin-card-${index}`"
            :can-delete-custom-plugin="canDeleteCustomPlugin"
            :can-edit-custom-plugin="canEditCustomPlugin"
            :config="config"
            :navigate-on-click="!props.streamingPlugins && navigateOnClick"
            :plugin="plugin"
            @custom-plugin-delete="handleCustomPluginDelete(plugin)"
            @plugin-clicked="emitPluginData"
          />
        </div>
      </template>

      <div class="plugin-card-container">
        <PluginSelectCard
          v-for="(plugin, index) in getPluginCards('hidden', modifiedCustomPlugins, pluginsPerRow)"
          :key="`plugin-card-${index}`"
          :can-delete-custom-plugin="canDeleteCustomPlugin"
          :can-edit-custom-plugin="canEditCustomPlugin"
          :config="config"
          :navigate-on-click="!props.streamingPlugins && navigateOnClick"
          :plugin="plugin"
          @plugin-clicked="emitPluginData"
        />
      </div>
    </KCollapse>

    <DeleteCustomPluginSchemaModal
      v-if="openDeleteModal && selectedPlugin"
      :config="config"
      :plugin="selectedPlugin"
      @closed="handleClose"
      @proceed="handleClose(true)"
    />
  </div>
</template>

<script setup lang="ts">
import { type Asset, type AssetPluginMetadata } from '@kong-ui-public/entities-assets'
import { useAxios } from '@kong-ui-public/entities-shared'
import { computed, onBeforeMount, ref, type PropType } from 'vue'
import composables from '../../composables'
import endpoints from '../../plugins-endpoints'
import {
  PluginGroup,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
  type PluginType,
} from '../../types'
import PluginSelectCard from '../select/PluginSelectCard.vue'
import DeleteCustomPluginSchemaModal from './DeleteCustomPluginSchemaModal.vue'

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
   * Whether or not user has rights to create custom plugins
   */
  canCreateCustomPlugin: {
    type: Boolean,
    default: false,
  },
  /**
   * Whether or not user has rights to delete custom plugins
   */
  canDeleteCustomPlugin: {
    type: Boolean,
    default: false,
  },
  /**
   * Whether or not user has rights to edit custom plugins
   */
  canEditCustomPlugin: {
    type: Boolean,
    default: false,
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

  streamingPlugins: {
    type: Boolean,
    default: false,
  },
})

const { axiosInstance } = useAxios({
  headers: props.config.requestHeaders,
})

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'revalidate'): void, /** internal use only */
  (e: 'delete:success', pluginName: string): void,
}>()

const { i18n: { t } } = composables.useI18n()
const { getPluginCards } = composables.usePluginHelpers()
const shouldCollapsedCustomPlugins = ref(true)

const pluginsFromAssets = ref<PluginType[]>([])

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

const modifiedCustomPlugins = computed((): PluginType[] => {
  if (props.config.app === 'kongManager' && !props.streamingPlugins) {
    return []
  }

  const customPlugins: PluginType[] = !props.streamingPlugins ? JSON.parse(JSON.stringify(props.pluginList))[PluginGroup.CUSTOM_PLUGINS] || [] : pluginsFromAssets.value

  // ADD CUSTOM_PLUGIN_CREATE as the first card if allowed creation
  return props.canCreateCustomPlugin && props.navigateOnClick && props.config.createCustomRoute
    ? ([{
      id: 'custom-plugin-create',
      name: !props.streamingPlugins ? t('plugins.select.tabs.custom.create.name') : t('plugins.select.tabs.streaming.create.name'),
      available: true,
      group: !props.streamingPlugins ? PluginGroup.CUSTOM_PLUGINS : PluginGroup.STREAMING_PLUGINS,
      description: !props.streamingPlugins ? t('plugins.select.tabs.custom.create.description') : t('plugins.select.tabs.streaming.create.description'),
    }] as PluginType[]).concat(customPlugins)
    : customPlugins
})

// text for plugin group "view x more" label
const triggerLabel = computed((): string => {
  const totalCount = getPluginCards('all', modifiedCustomPlugins.value, props.pluginsPerRow)?.length
  const hiddenCount = getPluginCards('hidden', modifiedCustomPlugins.value, props.pluginsPerRow)?.length

  if (totalCount > props.pluginsPerRow) {
    return t('plugins.select.view_more', { count: hiddenCount })
  }

  return t('plugins.select.view_less')
})

const openDeleteModal = ref(false)
const selectedPlugin = ref<{ name: string, id: string } | null>(null)

const handleCustomPluginDelete = (plugin: PluginType): void => {
  openDeleteModal.value = true
  selectedPlugin.value = {
    id: plugin.id,
    name: plugin.name,
  }
}

const handleClose = (revalidate?: boolean): void => {
  if (revalidate) {
    emit('revalidate')
    emit('delete:success', selectedPlugin.value?.name || '')
  }

  openDeleteModal.value = false
  selectedPlugin.value = null
}

onBeforeMount(async () => {
  if (props.streamingPlugins) {
    const { data } = await axiosInstance.get(`${props.config.apiBaseUrl}${endpoints.select.kongManager.assetsForOss}?size=1000`)
    const assets: Asset[] = data.data

    const plugins = assets.reduce((plugins, asset) => {
      if (asset.metadata.type === 'plugin') {
        const plugin = (asset.metadata as AssetPluginMetadata).plugin_name
        if (!(plugin in plugins)) {
          plugins[plugin] = {
            plugin,
            assetId: asset.id,
          }
        }
      }

      return plugins
    }, {} as { [plugin: string]: { plugin: string; assetId: string } })

    pluginsFromAssets.value = Object.values(plugins)
      .map((plugin) => ({
        id: plugin.plugin,
        name: plugin.plugin,
        available: true,
        group: PluginGroup.STREAMING_PLUGINS,
        description: '',
        assetId: plugin.assetId,
      } as PluginType))
  }
})
</script>

<style lang="scss" scoped>
:deep(.empty-state-wrapper) {
  .custom-plugins-empty-state {
    padding-bottom: $kui-space-0;

    .empty-state-title {
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-semibold;
    }

    .empty-state-description {
      font-size: $kui-font-size-30;
      margin-left: $kui-space-60;
      margin-right: $kui-space-60;
    }
  }
}

.plugins-collapse {
  margin-bottom: $kui-space-90;
}

.plugin-card-container {
  column-gap: 50px;
  display: grid;
  grid-auto-rows: 1fr;
  margin-top: $kui-space-90;
  row-gap: $kui-space-90;

  :deep(.kong-card) {
    display: flex;
    flex: 1 0 0;
    flex-direction: column;
    margin: $kui-space-0;
    padding: $kui-space-0;
    text-align: center;
  }

  :deep(.k-card-body) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  @media (min-width: $kui-breakpoint-phablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $kui-breakpoint-tablet) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: $kui-breakpoint-laptop) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
