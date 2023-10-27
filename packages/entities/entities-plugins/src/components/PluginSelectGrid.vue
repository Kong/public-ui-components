<template>
  <div>
    <section v-if="isLoading">
      <KSkeleton
        :table-rows="1"
        type="table"
      >
        <KSkeletonBox
          width="6"
        />
        <KSkeletonBox
          class="title-loading-skeleton"
          width="6"
        />
      </KSkeleton>
      <PluginCardSkeleton
        :card-count="8"
        type="card"
      />
    </section>

    <KEmptyState
      v-else-if="fetchErrorMessage"
      data-testid="form-fetch-error"
      hide-cta
      is-error
    >
      <template #message>
        <h3>{{ fetchErrorMessage }}</h3>
      </template>
    </KEmptyState>

    <template v-for="(group, idx) in PluginGroupArray">
      <div
        v-if="nonCustomPlugins[group]"
        :key="idx"
      >
        <KCollapse
          v-model="shouldCollapsed[idx]"
          class="plugins-collapse"
          :data-testid="`${group}-collapse`"
          :title="group"
          :trigger-label="!shouldCollapsed[idx] ? triggerLabels[group] : t('plugins.select.view_less')"
        >
          <!-- don't display a trigger if all plugins will already be visible -->
          <template
            v-if="getGroupPluginCount(group) <= pluginsPerRow"
            #trigger
          >
            &nbsp;
          </template>
          <template #visible-content>
            <div class="plugin-card-container">
              <PluginSelectCard
                v-for="(plugin, index) in getPluginCards(group, 'visible')"
                :key="index"
                :config="config"
                :no-route-change="noRouteChange"
                :plugin="plugin"
                @plugin-clicked="emitPluginData"
              />
            </div>
          </template>

          <div class="plugin-card-container">
            <PluginSelectCard
              v-for="(plugin, index) in getPluginCards(group, 'hidden')"
              :key="index"
              :config="config"
              :no-route-change="noRouteChange"
              :plugin="plugin"
              @plugin-clicked="emitPluginData"
            />
          </div>
        </KCollapse>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import {
  PluginGroup,
  PluginGroupArray,
  PluginScope,
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  type KongManagerPluginFormConfig,
  type KonnectPluginFormConfig,
  type PluginType,
  type DisabledPlugin,
  type PluginCardList,
  type TriggerLabels,
} from '../types'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../plugins-endpoints'
import PluginCardSkeleton from './PluginCardSkeleton.vue'
import PluginSelectCard from './PluginSelectCard.vue'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.getCreateRoute) return false
      return true
    },
  },
  canCreate: {
    type: Boolean,
    default: true,
  },
  /**
    * @param {boolean} onlyAvailablePlugins checks kong config plugins.available_on_server and if
    * onlyAvailablePlugins = true, then it will not show plugins from PluginMeta that are outside
    * of the available_on_server array.
    */
  onlyAvailablePlugins: {
    type: Boolean,
    default: false,
  },
  /**
   * Manually control plugins that should not be displayed
   */
  ignoredPlugins: {
    type: Array as PropType<String[]>,
    default: () => [],
  },
  /**
   * Plugins that are displayed but should not be selectable a displayed with a tooltip
   */
  disabledPlugins: {
    type: Object as PropType<DisabledPlugin>,
    default: () => ({}),
  },
  filteredPlugins: {
    type: Object as PropType<PluginCardList>,
    default: () => ({}),
  },
  /**
   * @param {boolean} noRouteChange if true, let consuming component handle event when clicking on a plugin
   * Used in conjunction with `@plugin-clicked` event
   */
  noRouteChange: {
    type: Boolean,
    default: false,
  },
  /**
   * Number of plugins to always have visible (never will be collapsed)
   */
  pluginsPerRow: {
    type: Number,
    default: 4,
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'plugin-list-updated', pluginsList: PluginCardList): void
}>()

const route = useRoute()
const { i18n: { t } } = composables.useI18n()
const { sortAlpha, objectsAreEqual } = useHelpers()
const { getMessageFromError } = useErrors()
const { pluginMetaData } = composables.usePluginMetaData()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const availablePlugins = ref<string[]>([])
const pluginsList = ref<PluginCardList>({})
const isLoading = ref(true)
const fetchErrorMessage = ref('')

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

// used for scoped plugins
// entityType is currently determined off of the route query
const entityType = computed((): string => String(route.query.entity_type || ''))

// remove custom plugin from original filteredPlugins
const nonCustomPlugins = computed((): PluginCardList => {
  const kongPlugins = JSON.parse(JSON.stringify(props.filteredPlugins))

  delete kongPlugins[PluginGroup.CUSTOM_PLUGINS]

  return kongPlugins
})

const buildPluginList = (): PluginCardList => {
  // If onlyAvailablePlugins is false, we included unavailable plugins from pluginMeta in addition to available plugins
  // returning an array of unique plugin ids
  // either grab all plugins from metadata file or use list of available plugins provided by API
  return [...new Set(
    Object.assign(
      Object.keys({ ...(!props.onlyAvailablePlugins ? pluginMetaData : {}) }),
      availablePlugins.value,
    ),
  )]
    // Filter out ignored plugins
    .filter((plugin: string) => !props.ignoredPlugins.includes(plugin))
    // Filter plugins by entity type if adding scoped plugin
    .filter((plugin: string) => {
      // For Global Plugins
      if (!entityType.value) {
        return plugin
      }

      if (entityType.value === 'service_id') {
        const isNotServicePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.SERVICE))
        if (isNotServicePlugin) {
          return false
        }
      }

      if (entityType.value === 'route_id') {
        const isNotRoutePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.ROUTE))
        if (isNotRoutePlugin) {
          return false
        }
      }

      if (entityType.value === 'consumer_group_id') {
        const isNotConsumerGroupPlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.CONSUMER_GROUP))
        if (isNotConsumerGroupPlugin) {
          return false
        }
      }

      if (entityType.value === 'consumer_id') {
        const isNotConsumerPlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.CONSUMER))
        if (isNotConsumerPlugin) {
          return false
        }
      }

      if (entityType.value !== 'developer_id') {
        return plugin
      }

      return false
    })
    // build the actual card list
    .reduce((list: PluginCardList, pluginId: string) => {
      const pluginName = (pluginMetaData[pluginId] && pluginMetaData[pluginId].name) || pluginId
      const plugin = {
        ...pluginMetaData[pluginId],
        id: pluginId,
        name: pluginName,
        available: availablePlugins.value.includes(pluginId),
        group: pluginMetaData[pluginId]?.group || PluginGroup.CUSTOM_PLUGINS,
      } as PluginType

      if (props.disabledPlugins) {
        plugin.disabledMessage = props.disabledPlugins[pluginId] || ''
      }

      const groupName = plugin.group || t('plugins.select.misc_plugins')
      let plugins = list[groupName]

      if (!plugins) {
        plugins = []
      }

      plugins.push(plugin)
      plugins.sort(sortAlpha('name'))

      list[groupName] = plugins

      return list
    }, {})
}

const getPluginCards = (group: string, type: 'all' | 'visible' | 'hidden') => {
  const plugins = nonCustomPlugins.value[group as keyof PluginCardList] || []

  if (type === 'all') {
    return plugins
  } else if (type === 'visible') {
    return plugins.slice(0, props.pluginsPerRow)
  }

  return plugins.slice(props.pluginsPerRow)
}

const getGroupPluginCount = (group: string) => {
  return nonCustomPlugins.value[group as keyof PluginCardList]?.length || 0
}

const shouldCollapsed = ref<Record<string, boolean>>(PLUGIN_GROUPS_COLLAPSE_STATUS)

// text for plugin group "view x more" label
const triggerLabels = computed(() => {
  return Object.keys(pluginsList.value).reduce((acc: TriggerLabels, pluginGroup: string): TriggerLabels => {
    const totalCount = getPluginCards(pluginGroup, 'all')?.length || 0
    const hiddenCount = getPluginCards(pluginGroup, 'hidden')?.length || 0

    if (totalCount > props.pluginsPerRow) {
      acc[pluginGroup as keyof TriggerLabels] = t('plugins.select.view_more', { count: hiddenCount })
    }

    return acc
  }, {})
})

const availablePluginsUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].availablePlugins}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  return url
})

// race condition between fetch of available plugins and setting
// disabled/ignored plugins
// if disabled/ignored plugins changes before availablePlugins fetch
// wait for fetch to finish and don't attempt to build plugin list yet
// if disabled/ignored plugins changes AFTER availablePlugins fetch
// rebuild the list
watch(() => props.disabledPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal) && !isLoading.value) {
    pluginsList.value = buildPluginList()
    emit('plugin-list-updated', pluginsList.value)
  }
})

watch(() => props.ignoredPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal) && !isLoading.value) {
    pluginsList.value = buildPluginList()
    emit('plugin-list-updated', pluginsList.value)
  }
})

onMounted(async () => {
  fetchErrorMessage.value = ''
  isLoading.value = true
  emit('loading', isLoading.value)

  try {
    const res = await axiosInstance.get(availablePluginsUrl.value)

    // TODO: endpoints temporarily return different formats
    if (props.config.app === 'konnect') {
      const { names: available } = res.data
      availablePlugins.value = available || []
    } else if (props.config.app === 'kongManager') {
      const { plugins: { available_on_server: aPlugins } } = res.data
      availablePlugins.value = aPlugins ? Object.keys(aPlugins) : []
    }

    pluginsList.value = buildPluginList()
    emit('plugin-list-updated', pluginsList.value)
  } catch (error: any) {
    fetchErrorMessage.value = getMessageFromError(error)
  }

  isLoading.value = false
  emit('loading', isLoading.value)
})
</script>

<style lang="scss" scoped>
// TODO: styles from KM?
.plugins-collapse {
  margin-bottom: $kui-space-90;
}

.plugin-card-container {
  column-gap: $kui-space-80;
  display: grid;
  grid-auto-rows: 1fr;
  margin-top: $kui-space-90;
  row-gap: $kui-space-90;

  .plugin-card-cursor-pointer {
    cursor: pointer;
  }

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
