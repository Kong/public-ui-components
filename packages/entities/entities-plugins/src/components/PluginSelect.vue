<template>
  <div class="kong-ui-entities-plugin-select-form">
    <div class="plugins-filter-input-container">
      <KInput
        ref="filter-input"
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
      <KTabs
        v-if="tabs.length"
        v-model="activeTab"
        data-testid="plugins-tabs"
        :tabs="tabs"
        @change="onTabsChange"
      >
        <template
          v-if="customPluginsDisabled"
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
              :can-delete-custom-plugin="usercanDeleteCustomPlugin"
              :can-edit-custom-plugin="usercanEditCustomPlugin"
              :config="config"
              :hide-highlighted-plugins="filter.length > 0"
              :highlighted-plugins="highlightedPlugins"
              :highlighted-plugins-title="props.highlightedPluginsTitle"
              :navigate-on-click="navigateOnClick"
              :plugin-list="filteredPlugins"
              @delete:success="handleCustomPluginDeleteSuccess"
              @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
            />
          </div>
        </template>

        <template #custom>
          <div data-testid="custom-tab">
            <slot name="before-custom-tab-content" />

            <p class="tab-description">
              {{ t('plugins.select.tabs.custom.description') }}
            </p>

            <KAlert
              v-if="customPluginsListError"
              appearance="warning"
              class="custom-plugins-warning"
              :message="customPluginsListError"
            />

            <PluginCustomGrid
              :can-create-custom-plugin="usercanCreateCustomPlugin"
              :can-delete-custom-plugin="usercanDeleteCustomPlugin"
              :can-edit-custom-plugin="usercanEditCustomPlugin"
              :config="config"
              :navigate-on-click="navigateOnClick"
              :plugin-list="filteredPlugins"
              @delete:success="handleCustomPluginDeleteSuccess"
              @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
            />
          </div>
        </template>
      </KTabs>

      <div v-else>
        <KAlert
          v-if="customPluginsListError"
          appearance="warning"
          class="custom-plugins-warning"
          :message="customPluginsListError"
        />

        <PluginSelectGrid
          :can-delete-custom-plugin="usercanDeleteCustomPlugin"
          :can-edit-custom-plugin="usercanEditCustomPlugin"
          :config="config"
          :hide-highlighted-plugins="filter.length > 0"
          :highlighted-plugins="highlightedPlugins"
          :highlighted-plugins-title="props.highlightedPluginsTitle"
          :navigate-on-click="navigateOnClick"
          :plugin-list="filteredPlugins"
          @delete:success="handleCustomPluginDeleteSuccess"
          @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeMount, onBeforeUnmount, onMounted, type PropType, useTemplateRef } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute, useRouter } from 'vue-router'
import {
  type ClonedPluginSchema,
  PluginGroup,
  PluginScope,
  type CustomPluginSupportLevel,
  type CustomPluginType,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type DisabledPlugin,
  type PluginCardList,
  type StreamingCustomPluginSchema,
} from '../types'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import { fetchAllPages } from '../composables/useCustomPluginApi'
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
    type: [String, Array] as PropType<CustomPluginSupportLevel>,
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
  (e: 'loading', isLoading: boolean): void
  (e: 'plugin-clicked', plugin: PluginType): void
  (e: 'delete-custom:success', pluginName: string): void
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
const customPluginsListError = ref('')
const availablePlugins = ref<string[]>([]) // all available plugins
const streamingCustomPlugins = ref<StreamingCustomPluginSchema[]>([])
const clonedCustomPlugins = ref<ClonedPluginSchema[]>([])
const pluginsList = ref<PluginCardList>({})
const existingEntityPlugins = ref<string[]>([])
const abortController = ref<AbortController | null>(null)
const hasMounted = ref(false)

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const normalizeCustomPluginSupport = (support: CustomPluginSupportLevel): Set<CustomPluginType> => {
  if (support === 'none' || support === 'disabled') {
    return new Set()
  }

  return new Set(Array.isArray(support) ? support : [support])
}

const normalizedCustomPluginSupport = computed<Set<CustomPluginType>>(() => normalizeCustomPluginSupport(props.customPluginSupport))
const customPluginSupportKey = computed(() => [...normalizedCustomPluginSupport.value].sort().join('|'))
const hasCustomPluginSupport = computed(() => props.customPluginSupport !== 'none')
const customPluginsDisabled = computed(() => props.customPluginSupport === 'disabled')
const isStreamingCustomPluginSupported = computed(() => normalizedCustomPluginSupport.value.has('streaming'))
const isClonedCustomPluginSupported = computed(() => normalizedCustomPluginSupport.value.has('cloned'))
const shouldShowCreateCustomPluginCard = computed((): boolean => {
  return props.config.app === 'kongManager'
    && hasCustomPluginSupport.value
    && !customPluginsDisabled.value
    && usercanCreateCustomPlugin.value
    && props.navigateOnClick
    && !!props.config.createCustomRoute
})

const isRequestCancelled = (error: unknown): boolean => {
  return isAxiosError(error) && error.code === 'ERR_CANCELED'
}

const isClonedPluginLicenseError = (error: unknown): boolean => {
  return getMessageFromError(error).toLowerCase().includes('requires a license')
}

const flattenPluginMap = computed(() => {
  if (!pluginsList.value) {
    return {}
  }

  return Object.entries(pluginsList.value)
    .filter(([group]) => group !== PluginGroup.CUSTOM_PLUGINS)
    .reduce((m, [, plugins]) => {
      for (const plugin of plugins ?? []) {
        m[plugin.id] = plugin
      }
      return m
    }, {} as Record<string, PluginType>)
})

const createCustomPluginCard = computed((): PluginType => ({
  id: 'custom-plugin-create',
  name: t('plugins.select.tabs.custom.create.name'),
  nameKey: 'plugins.select.tabs.custom.create.name',
  description: t('plugins.select.tabs.custom.create.description'),
  descriptionKey: 'plugins.select.tabs.custom.create.description',
  available: true,
  group: PluginGroup.CUSTOM_PLUGINS,
  scope: [],
}))

const filteredPlugins = computed((): PluginCardList => {
  if (!pluginsList.value) {
    return {}
  }

  const query = filter.value.toLowerCase()
  const results = JSON.parse(JSON.stringify(pluginsList.value))

  for (const type in pluginsList.value) {
    const matches = pluginsList.value[type as keyof PluginCardList]?.filter((plugin: PluginType) => {
      return plugin.name.toLowerCase().includes(query)
        || plugin.id.toLowerCase().includes(query)
        || plugin.group.toLowerCase().includes(query)
        || plugin.clonedFromLink?.toLowerCase().includes(query)
        || plugin.customPluginType?.toLowerCase().includes(query)
    }) || []

    if (!matches.length) {
      delete results[type]
    } else {
      results[type] = matches
    }
  }

  if (shouldShowCreateCustomPluginCard.value) {
    const customPlugins = (results[PluginGroup.CUSTOM_PLUGINS] || []).filter((plugin: PluginType) => plugin.id !== createCustomPluginCard.value.id)
    results[PluginGroup.CUSTOM_PLUGINS] = [createCustomPluginCard.value, ...customPlugins]
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
  if (props.config.app !== 'konnect' || !hasCustomPluginSupport.value) {
    return []
  }

  return [{
    hash: '#kong',
    title: t('plugins.select.tabs.kong.title'),
  },
  {
    hash: '#custom',
    title: t('plugins.select.tabs.custom.title'),
    disabled: customPluginsDisabled.value,
  }]
})

const activeTab = computed(() => {
  let hash = tabs.value.length ? route?.hash || tabs.value[0]?.hash || '' : ''
  // If custom plugins are disabled, default to kong tab
  if (hash === '#custom' && customPluginsDisabled.value) {
    hash = '#kong'
  }
  return hash
})

const buildPluginList = (): PluginCardList => {
  const allCustomPluginNames = new Set<string>([
    ...streamingCustomPlugins.value.map(plugin => plugin.name),
    ...clonedCustomPlugins.value.map(plugin => plugin.name),
  ])

  // If availableOnServer is false, we included unavailable plugins from pluginMeta in addition to available plugins
  // returning an array of unique plugin ids
  // either grab all plugins from metadata file or use list of available plugins provided by API
  return [...new Set(
    [
      ...Object.keys({ ...(!props.availableOnServer ? pluginMetaData : {}) }),
      ...availablePlugins.value,
      ...allCustomPluginNames,
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
      const clonedPlugin = clonedCustomPlugins.value.find(customPlugin => customPlugin.name === pluginId)
      const streamingPlugin = streamingCustomPlugins.value.find(customPlugin => customPlugin.name === pluginId)
      const plugin: PluginType = {
        ...pluginMetaData[pluginId],
        id: pluginId,
        name: pluginName,
        available: availablePlugins.value.includes(pluginId) || !!clonedPlugin || !!streamingPlugin,
        disabledMessage: '',
        group: pluginMetaData[pluginId]?.group || PluginGroup.CUSTOM_PLUGINS,
      }

      if (plugin.group === PluginGroup.CUSTOM_PLUGINS) {
        if (clonedPlugin) {
          plugin.customPluginType = 'cloned'
          plugin.clonedFromLink = clonedPlugin.link
        } else if (streamingPlugin) {
          plugin.customPluginType = 'streaming'
        } else {
          plugin.customPluginType = 'schema'
        }
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
    }, {} as PluginCardList)
}

const injectKongManagerCreateCard = (list: PluginCardList): PluginCardList => {
  if (!shouldShowCreateCustomPluginCard.value) {
    return list
  }

  const customPlugins = list[PluginGroup.CUSTOM_PLUGINS] || []
  const filteredCustomPlugins = customPlugins.filter((plugin) => plugin.id !== 'custom-plugin-create')

  list[PluginGroup.CUSTOM_PLUGINS] = [createCustomPluginCard.value, ...filteredCustomPlugins]

  return list
}

const buildPluginListWithCustomCreateCard = (): PluginCardList => {
  return injectKongManagerCreateCard(buildPluginList())
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
  if (isStreamingCustomPluginSupported.value) {
    let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].streamingCustomPlugins}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    } else if (props.config.app === 'kongManager') {
      url = url.replace(/{workspace}/gi, props.config.workspace || '')
    }

    return url
  }

  return null
})

const clonedPluginsUrl = computed<string | null>(() => {
  if (isClonedCustomPluginSupported.value) {
    let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].clonedPlugins}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    } else if (props.config.app === 'kongManager') {
      url = url.replace(/{workspace}/gi, props.config.workspace || '')
    }

    return url
  }

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
    pluginsList.value = buildPluginListWithCustomCreateCard()
  }
})

watch(() => props.ignoredPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal) && !isLoading.value) {
    pluginsList.value = buildPluginListWithCustomCreateCard()
  }
})

watch((isLoading), (loading: boolean) => {
  emit('loading', loading)
})

const loadEntityPlugins = async (signal?: AbortSignal): Promise<void> => {
  if (!fetchEntityPluginsUrl.value) {
    existingEntityPlugins.value = []
    return
  }

  try {
    const { data: { data } } = await axiosInstance.get(fetchEntityPluginsUrl.value, { signal })

    if (data?.length) {
      existingEntityPlugins.value = data.reduce((plugins: string[], plugin: Record<string, any>) => {
        if (plugin.name) {
          plugins.push(plugin.name)
        }

        return plugins
      }, [])
    }
  } catch (error) {
    if (!isRequestCancelled(error)) {
      existingEntityPlugins.value = []
    }
  }
}

const loadCustomPlugins = async (signal?: AbortSignal): Promise<void> => {
  const requests: Array<Promise<void>> = []

  if (streamingPluginsUrl.value) {
    requests.push(
      fetchAllPages<StreamingCustomPluginSchema>(axiosInstance, streamingPluginsUrl.value, signal)
        .then((plugins): void => {
          streamingCustomPlugins.value = plugins
          return undefined
        })
        .catch((error) => {
          if (!isRequestCancelled(error)) {
            customPluginsListError.value = getMessageFromError(error) || t('plugins.select.tabs.custom.fetch_error')
          }
        }),
    )
  }

  if (clonedPluginsUrl.value) {
    requests.push(
      fetchAllPages<ClonedPluginSchema>(axiosInstance, clonedPluginsUrl.value, signal)
        .then((plugins): void => {
          clonedCustomPlugins.value = plugins
          return undefined
        })
        .catch((error) => {
          if (isRequestCancelled(error)) {
            return
          }

          customPluginsListError.value = isClonedPluginLicenseError(error)
            ? t('plugins.select.tabs.custom.license_required')
            : getMessageFromError(error) || t('plugins.select.tabs.custom.fetch_error')
        }),
    )
  }

  requests.push(loadEntityPlugins(signal))

  await Promise.allSettled(requests)
}

const loadPlugins = async (): Promise<void> => {
  abortController.value?.abort()
  abortController.value = new AbortController()

  isLoading.value = true
  hasError.value = false
  fetchErrorMessage.value = ''
  customPluginsListError.value = ''
  availablePlugins.value = []
  streamingCustomPlugins.value = []
  clonedCustomPlugins.value = []
  existingEntityPlugins.value = []

  try {
    const { data } = await axiosInstance.get(availablePluginsUrl.value, { signal: abortController.value.signal })

    // TODO: endpoints temporarily return different formats
    if (props.config.app === 'konnect') {
      const { names: allAvailablePlugins } = data
      availablePlugins.value = allAvailablePlugins || []
    } else if (props.config.app === 'kongManager') {
      const { plugins: { available_on_server: aPlugins } } = data
      availablePlugins.value = aPlugins ? Object.keys(aPlugins) : []
    }

    await loadCustomPlugins(abortController.value.signal)
    pluginsList.value = buildPluginListWithCustomCreateCard()
  } catch (error: any) {
    if (!isRequestCancelled(error)) {
      hasError.value = true
      fetchErrorMessage.value = getMessageFromError(error)
    }
  } finally {
    if (!abortController.value?.signal.aborted) {
      isLoading.value = false
    }
  }
}

const usercanCreateCustomPlugin = ref(false)
const usercanEditCustomPlugin = ref(false)
const usercanDeleteCustomPlugin = ref(false)

const handleCustomPluginDeleteSuccess = (pluginName: string): void => {
  streamingCustomPlugins.value = streamingCustomPlugins.value.filter((plugin) => plugin.name !== pluginName)
  clonedCustomPlugins.value = clonedCustomPlugins.value.filter((plugin) => plugin.name !== pluginName)
  pluginsList.value = buildPluginListWithCustomCreateCard()
  emit('delete-custom:success', pluginName)
}

onBeforeMount(async () => {
  // Evaluate the user permissions
  usercanCreateCustomPlugin.value = await props.canCreateCustomPlugin()
  usercanEditCustomPlugin.value = await props.canEditCustomPlugin()
  usercanDeleteCustomPlugin.value = await props.canDeleteCustomPlugin()
})

const filterInput = useTemplateRef('filter-input')

onMounted(async () => {
  hasMounted.value = true
  filterInput.value?.input?.focus()
  await loadPlugins()
})

watch(
  () => [
    props.config.app === 'kongManager' ? props.config.workspace : undefined,
    props.config.app === 'konnect' ? props.config.controlPlaneId : undefined,
    props.config.entityType,
    props.config.entityId,
    props.config.app === 'kongManager' ? props.config.gatewayInfo?.edition : undefined,
    customPluginSupportKey.value,
  ],
  async () => {
    if (hasMounted.value) {
      await loadPlugins()
    }
  },
)

watch(shouldShowCreateCustomPluginCard, () => {
  if (!isLoading.value) {
    pluginsList.value = buildPluginListWithCustomCreateCard()
  }
})

onBeforeUnmount(() => {
  abortController.value?.abort()
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-select-form {
  .plugins-skeleton {
    &-title {
      margin-bottom: var(--kui-space-50, $kui-space-50);
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
      margin-bottom: var(--kui-space-60, $kui-space-60);
    }
  }

  .plugins-results-container {
    .tab-description {
      margin-bottom: var(--kui-space-80, $kui-space-80);
      margin-top: var(--kui-space-80, $kui-space-80);
    }

    .custom-plugins-warning {
      margin-bottom: var(--kui-space-80, $kui-space-80);
    }
  }
}
</style>
