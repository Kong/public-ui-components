<template>
  <div class="kong-ui-entities-plugin-select-form">
    <div class="plugins-filter-input-container">
      <KInput
        v-model.trim="filter"
        class="plugins-filter-input"
        data-testid="plugins-filter"
        :placeholder="t('search.placeholder.select')"
        type="search"
      />
    </div>

    <section v-if="isLoading">
      <KSkeletonBox
        class="plugins-skeleton-title"
        width="10"
      />
      <KSkeleton
        :card-count="8"
        class="plugins-skeleton-cards"
        type="card"
      />
    </section>

    <KEmptyState
      v-else-if="hasError"
      :action-button-visible="false"
      data-testid="plugins-fetch-error"
      icon-variant="error"
    >
      <template #default>
        <h3>{{ fetchErrorMessage }}</h3>
      </template>
    </KEmptyState>

    <KEmptyState
      v-else-if="noSearchResults && filter"
      :action-button-visible="false"
      data-testid="plugins-empty-state"
      icon-variant="search"
    >
      <template #default>
        <h5>{{ t('search.no_results', { filter }) }}</h5>
      </template>
    </KEmptyState>

    <section
      v-else
      aria-live="polite"
      class="plugins-results-container"
    >
      <!-- Konnect -->
      <KTabs
        v-if="tabs.length && customPluginSupport !== 'none'"
        v-model="activeTab"
        data-testid="plugins-tabs"
        :tabs="tabs"
        @change="onTabsChange"
      >
        <template
          v-if="customPluginSupport === 'disabled'"
          #custom-anchor
        >
          <KTooltip
            max-width="300"
            :text="t('plugins.select.tabs.custom.disabled_tooltip')"
          >
            <div>{{ t('plugins.select.tabs.custom.title') }}</div>
          </KTooltip>
        </template>

        <template #kong>
          <div data-testid="kong-tab">
            <p class="tab-description">
              {{ t('plugins.select.tabs.kong.description') }}
            </p>

            <PluginSelectGrid
              :config="config"
              :hide-highlighted-plugins="filter.length > 0"
              :highlighted-plugins="highlightedPlugins"
              :highlighted-plugins-title="props.highlightedPluginsTitle"
              :navigate-on-click="navigateOnClick"
              :plugin-list="filteredPlugins"
              @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
            />
          </div>
        </template>

        <template #custom>
          <div data-testid="custom-tab">
            <p class="tab-description">
              {{ t('plugins.select.tabs.custom.description') }}
            </p>

            <PluginCustomGrid
              :can-create-custom-plugin="usercanCreateCustomPlugin"
              :can-delete-custom-plugin="usercanDeleteCustomPlugin"
              :can-edit-custom-plugin="usercanEditCustomPlugin"
              :config="config"
              :navigate-on-click="navigateOnClick"
              :plugin-list="filteredPlugins"
              @delete:success="(name: string) => $emit('delete-custom:success', name)"
              @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
              @revalidate="() => pluginsList = buildPluginList()"
            />
          </div>
        </template>
      </KTabs>

      <!-- Kong Manager -->
      <PluginSelectGrid
        v-else
        :config="config"
        :hide-highlighted-plugins="filter.length > 0"
        :highlighted-plugins="highlightedPlugins"
        :highlighted-plugins-title="props.highlightedPluginsTitle"
        :navigate-on-click="navigateOnClick"
        :plugin-list="filteredPlugins"
        @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeMount, onMounted, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PluginGroup,
  PluginScope,
  type CustomPluginSupportLevel,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type DisabledPlugin,
  type PluginCardList,
  type StreamingCustomPluginSchema,
} from '../types'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../plugins-endpoints'
import PluginCustomGrid from './custom-plugins/PluginCustomGrid.vue'
import PluginSelectGrid from './select/PluginSelectGrid.vue'

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
  /** custom plugin support level */
  customPluginSupport: {
    type: String as PropType<CustomPluginSupportLevel>,
    default: 'none',
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a custom plugin */
  canCreateCustomPlugin: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a custom plugin */
  canDeleteCustomPlugin: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit custom plugin */
  canEditCustomPlugin: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
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
    * @param {boolean} availableOnServer checks kong config plugins.available_on_server and if
    * availableOnServer = true, then it will not show plugins from PluginMeta that are outside
    * of the available_on_server array.
    */
  availableOnServer: {
    type: Boolean,
    default: true,
  },
  /**
   * Plugins that should not be displayed
   */
  ignoredPlugins: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  /**
   * Plugins that should be disabled and their disabled messages.
   * ex. {
   *  'acl': 'ACL is not supported for this entity type',
   * }
   */
  disabledPlugins: {
    type: Object as PropType<DisabledPlugin>,
    default: () => ({}),
  },
  /**
   * Ids of plugins to show in the highlighted plugins group
   */
  highlightedPluginIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  /**
   * Title for the highlighted plugins group
   */
  highlightedPluginsTitle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'delete-custom:success', pluginName: string): void,
}>()

const route = useRoute()
const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { pluginMetaData } = composables.usePluginMetaData()
const { getMessageFromError } = useErrors()
const { sortAlpha, objectsAreEqual } = useHelpers()

const filter = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const fetchErrorMessage = ref('')
const availablePlugins = ref<string[]>([]) // all available plugins
const streamingCustomPlugins = ref<StreamingCustomPluginSchema[]>([])
const pluginsList = ref<PluginCardList>({})
const existingEntityPlugins = ref<string[]>([])

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const flattenPluginMap = computed(() => {
  if (!pluginsList.value) {
    return {}
  }

  return Object.entries(pluginsList.value)
    .filter(([group]) => group !== PluginGroup.CUSTOM_PLUGINS)
    .reduce((m, [, plugins]) => {
      for (const plugin of plugins) {
        m[plugin.id] = plugin
      }
      return m
    }, {} as Record<string, PluginType>)
})

const filteredPlugins = computed((): PluginCardList => {
  if (!pluginsList.value) {
    return {}
  }

  const query = filter.value.toLowerCase()
  const results = JSON.parse(JSON.stringify(pluginsList.value))

  for (const type in pluginsList.value) {
    const matches = pluginsList.value[type as keyof PluginCardList]?.filter((plugin: PluginType) => plugin.name.toLowerCase().includes(query) || plugin.id.toLowerCase().includes(query) || plugin.group.toLowerCase().includes(query)) || []

    if (!matches.length) {
      delete results[type]
    } else {
      results[type] = matches
    }
  }

  return results
})

const highlightedPlugins = computed(() => {
  return props.highlightedPluginIds.reduce((plugins, id) => {
    const plugin = flattenPluginMap.value[id]

    if (plugin) {
      plugins.push(plugin)
    }

    return plugins
  }, [] as PluginType[])
})

const hasFilteredResults = computed((): boolean => {
  return Object.keys(filteredPlugins.value).length > 0
})

const noSearchResults = computed((): boolean => {
  return (Object.keys(pluginsList.value).length > 0 && !hasFilteredResults.value)
})

const tabs = computed(() => {
  return props.config.app === 'konnect'
    ? [{
      hash: '#kong',
      title: t('plugins.select.tabs.kong.title'),
    },
    {
      hash: '#custom',
      title: t('plugins.select.tabs.custom.title'),
      disabled: ['none', 'disabled'].includes(props.customPluginSupport),
    }]
    : []
})

const activeTab = computed(() => {
  let hash = tabs.value.length ? route?.hash || tabs.value[0]?.hash || '' : ''
  // If custom plugins are disabled, default to kong tab
  if (hash === '#custom' && ['none', 'disabled'].includes(props.customPluginSupport)) {
    hash = '#kong'
  }
  return hash
})

const buildPluginList = (): PluginCardList => {
  // If availableOnServer is false, we included unavailable plugins from pluginMeta in addition to available plugins
  // returning an array of unique plugin ids
  // either grab all plugins from metadata file or use list of available plugins provided by API
  return [...new Set(
    [
      ...Object.keys({ ...(!props.availableOnServer ? pluginMetaData : {}) }),
      ...availablePlugins.value,
    ],
  )]
    // Filter out ignored plugins
    .filter((plugin: string) => !props.ignoredPlugins.includes(plugin))
    // Filter plugins by entity type if adding scoped plugin
    .filter((plugin: string) => {
      // For Global Plugins
      if (!props.config.entityType) {
        return plugin
      }

      if (props.config.entityType === 'services') {
        const isNotServicePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.SERVICE))
        if (isNotServicePlugin) {
          return false
        }
      }

      if (props.config.entityType === 'routes') {
        const isNotRoutePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.ROUTE))
        if (isNotRoutePlugin) {
          return false
        }
      }

      if (props.config.entityType === 'consumer_groups') {
        const isNotConsumerGroupPlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.CONSUMER_GROUP))
        if (isNotConsumerGroupPlugin) {
          return false
        }
      }

      if (props.config.entityType === 'consumers') {
        const isNotConsumerPlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.CONSUMER))
        if (isNotConsumerPlugin) {
          return false
        }
      }

      return plugin
    })
    // build the actual card list
    .reduce((list: PluginCardList, pluginId: string) => {
      const pluginName = (pluginMetaData[pluginId] && pluginMetaData[pluginId].name) || pluginId
      const plugin: PluginType = {
        ...pluginMetaData[pluginId],
        id: pluginId,
        name: pluginName,
        available: availablePlugins.value.includes(pluginId),
        disabledMessage: '',
        group: pluginMetaData[pluginId]?.group || PluginGroup.CUSTOM_PLUGINS,
      }

      if (plugin.group === PluginGroup.CUSTOM_PLUGINS) {
        plugin.customPluginType = streamingCustomPlugins.value.find(sp => sp.name === pluginId)
          ? 'streaming'
          : 'schema'
      }

      if (props.disabledPlugins) {
        plugin.disabledMessage = props.disabledPlugins[pluginId]
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

const availablePluginsUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].availablePlugins}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = props.config.gatewayInfo?.edition === 'community'
      ? `${props.config.apiBaseUrl}${endpoints.select[props.config.app].availablePluginsForOss}`
      : url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  return url
})

const streamingPluginsUrl = computed<string | null>(() => {
  if (props.config.app === 'konnect' && props.customPluginSupport === 'streaming') {
    let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].streamingCustomPlugins}`
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    return url
  }
  // Kong Manager and other support level does not support streaming custom plugins now
  return null
})

const fetchEntityPluginsUrl = computed((): string => {
  if (props.config.entityType && props.config.entityId) {
    let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].forEntity}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    } else if (props.config.app === 'kongManager') {
      url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
    }

    return url
      .replace(/{entityType}/gi, props.config.entityType || '')
      .replace(/{entityId}/gi, props.config.entityId || '')
  }

  return ''
})

const onTabsChange = (hash: string) => {
  router.replace({ hash, query: route.query })
}

// race condition between fetch of available plugins and setting
// disabled/ignored plugins
// if disabled/ignored plugins changes before availablePlugins fetch
// wait for fetch to finish and don't attempt to build plugin list yet
// if disabled/ignored plugins changes AFTER availablePlugins fetch
// rebuild the list
watch(() => props.disabledPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal) && !isLoading.value) {
    pluginsList.value = buildPluginList()
  }
})

watch(() => props.ignoredPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal) && !isLoading.value) {
    pluginsList.value = buildPluginList()
  }
})

watch((isLoading), (loading: boolean) => {
  emit('loading', loading)
})

const usercanCreateCustomPlugin = ref(false)
const usercanEditCustomPlugin = ref(false)
const usercanDeleteCustomPlugin = ref(false)

onBeforeMount(async () => {
  // Evaluate the user permissions
  usercanCreateCustomPlugin.value = await props.canCreateCustomPlugin()
  usercanEditCustomPlugin.value = await props.canEditCustomPlugin()
  usercanDeleteCustomPlugin.value = await props.canDeleteCustomPlugin()
})

onMounted(async () => {
  try {
    const { data } = await axiosInstance.get(availablePluginsUrl.value)

    // TODO: endpoints temporarily return different formats
    if (props.config.app === 'konnect') {
      const { names: allAvailablePlugins } = data
      availablePlugins.value = allAvailablePlugins || []
      if (streamingPluginsUrl.value) {
        // fetch streaming custom plugins for plugin type partition
        const { data: streamingCustomPluginsData } = await axiosInstance.get<{ data: StreamingCustomPluginSchema[] }>(streamingPluginsUrl.value)
        streamingCustomPlugins.value = streamingCustomPluginsData.data || []
      }
    } else if (props.config.app === 'kongManager') {
      const { plugins: { available_on_server: aPlugins } } = data
      availablePlugins.value = aPlugins ? Object.keys(aPlugins) : []
    }
  } catch (error: any) {
    hasError.value = true
    fetchErrorMessage.value = getMessageFromError(error)
  }

  // fetch scoped entity to check for pre-existing plugins
  if (fetchEntityPluginsUrl.value) {
    try {
      const { data: { data } } = await axiosInstance.get(fetchEntityPluginsUrl.value)

      if (data?.length) {
        const eplugins = data.reduce((plugins: string[], plugin: Record<string, any>) => {
          if (plugin.name) {
            plugins.push(plugin.name)
          }

          return plugins
        }, [])

        existingEntityPlugins.value = existingEntityPlugins.value.concat(eplugins)
      }
    } catch (error: any) {
      // no op if it fails, backend will catch if they try to create
      // duplicate plugins
    }
  }

  if (!hasError.value) {
    pluginsList.value = buildPluginList()
  }

  isLoading.value = false
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-select-form {
  .plugins-skeleton {
    &-title {
      margin-bottom: $kui-space-50;
    }

    &-cards {
      :deep(.skeleton-card-wrapper) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(0, 335px));

        .skeleton-card {
          max-width: none;
        }
      }
    }
  }

  .plugins-filter-input-container {
    display: flex;

    .plugins-filter-input {
      margin-bottom: $kui-space-60;
    }
  }

  .plugins-results-container {
    .tab-description {
      margin-bottom: $kui-space-80;
      margin-top: $kui-space-80;
    }
  }
}
</style>
