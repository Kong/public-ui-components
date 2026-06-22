<template>
  <div
    class="plugin-catalog"
    data-testid="plugin-catalog"
  >
    <div
      class="plugin-filter"
      data-testid="plugin-filter"
    >
      <div class="plugin-filter-title">
        {{ t('plugins.select.filter.title') }}
        <KButton
          appearance="tertiary"
          class="clear-selection"
          data-testid="clear-filter-selection"
          :disabled="!Object.values(typeFilter).some(v => v)"
          @click="clearTypeFilter"
        >
          {{ t('plugins.select.filter.clear') }}
        </KButton>
      </div>
      <KCollapse v-model="featuredFilterCollapse">
        <template #title>
          <div class="featured-title">
            {{ t('plugins.select.filter.featured') }}
          </div>
        </template>
        <div class="plugin-featured-filter">
          <div
            v-for="feature in PluginFeaturedArray"
            :key="feature"
            class="plugin-filter-item"
            :data-testid="`plugin-filter-item-${feature}`"
          >
            <KCheckbox
              v-model="typeFilter[feature]"
              :label="feature"
            />
            <KBadge appearance="neutral">
              {{ pluginsList?.[feature]?.length || 0 }}
            </KBadge>
          </div>
        </div>
      </KCollapse>
      <KCollapse v-model="groupFilterCollapse">
        <template #title>
          <div class="group-title">
            {{ t('plugins.select.filter.type') }}
          </div>
        </template>
        <div class="plugin-type-filter">
          <div
            v-for="group in PluginGroupArraySortedAlphabetically"
            :key="group"
            class="plugin-filter-item"
            :data-testid="`plugin-filter-item-${group}`"
          >
            <KCheckbox
              v-model="typeFilter[group]"
              :data-testid="`plugin-filter-checkbox-${group}`"
              :label="group"
            />
            <KBadge
              appearance="neutral"
              :data-testid="`plugin-filter-count-${group}`"
            >
              {{ pluginsList?.[group]?.length || 0 }}
            </KBadge>
          </div>
        </div>
      </KCollapse>
    </div>
    <div class="plugins-container">
      <div class="plugins-filter-input-container">
        <KInput
          ref="filter-input"
          v-model.trim="searchFilter"
          class="plugins-filter-input"
          data-testid="plugins-filter-input"
          :placeholder="t('search.placeholder.search_plugins')"
          type="search"
        />
        <div class="icon-container">
          <component
            :is="viewModeIcon"
            class="plugins-filter-icon"
            :color="`var(--kui-icon-color-primary, ${KUI_ICON_COLOR_PRIMARY})`"
            @click="isListView = !isListView"
          />
        </div>
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
        v-else-if="noSearchResults && searchFilter"
        :action-button-visible="false"
        data-testid="plugins-empty-state"
        icon-variant="search"
      >
        <template #default>
          <h5>{{ t('search.no_results', { filter: searchFilter }) }}</h5>
        </template>
      </KEmptyState>

      <section
        v-else
        aria-live="polite"
        class="plugins-results-container"
      >
        <KAlert
          v-if="customPluginsListError"
          appearance="warning"
          class="custom-plugins-warning"
          :message="customPluginsListError"
        />
        <PluginCatalogListView
          v-if="isListView"
          :can-delete-cloned-plugin="usercanDeleteClonedPlugin"
          :can-delete-custom-plugin="usercanDeleteCustomPlugin"
          :can-edit-cloned-plugin="usercanEditClonedPlugin"
          :can-edit-custom-plugin="usercanEditCustomPlugin"
          :config="config"
          :plugin-list="filteredPlugins"
          @delete:success="handleCustomPluginDeleteSuccess"
        />
        <PluginCatalogGrid
          v-else
          :can-delete-cloned-plugin="usercanDeleteClonedPlugin"
          :can-delete-custom-plugin="usercanDeleteCustomPlugin"
          :can-edit-cloned-plugin="usercanEditClonedPlugin"
          :can-edit-custom-plugin="usercanEditCustomPlugin"
          :config="config"
          :plugin-list="filteredPlugins"
          @delete:success="handleCustomPluginDeleteSuccess"
          @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, unref, useTemplateRef, watch, type MaybeRef } from 'vue'
import { isAxiosError } from 'axios'
import {
  type ClonedPluginSchema,
  PluginGroup,
  PluginScope,
  PluginFeaturedArray,
  PluginGroupArraySortedAlphabetically,
  type CustomPluginSupportLevel,
  type CustomPluginType,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type DisabledPlugin,
  type PluginCardList,
  type StreamingCustomPluginSchema,
  type CustomPluginDeletePayload,
} from '../types'
import composables from '../composables'
import endpoints from '../plugins-endpoints'
import PluginCatalogGrid from './select/PluginCatalogGrid.vue'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import { fetchAllPages } from '../composables/useCustomPluginApi'
import { KUI_ICON_COLOR_PRIMARY } from '@kong/design-tokens'
import { GridIcon, ListIcon } from '@kong/icons'
import { lcsRecursive } from '../utils/helper'
import PluginCatalogListView from './select/PluginCatalogListView.vue'
import { FEATURE_FLAGS as PLUGIN_FEATURE_FLAGS } from '../constants'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'plugin-clicked', plugin: PluginType): void
  (e: 'delete-custom:success', pluginName: string): void
}>()

type PluginCardListExtended = PluginCardList & {
  'Query Result'?: PluginType[]
}

type DeletedCustomPlugin = CustomPluginDeletePayload

const { i18n: { t } } = composables.useI18n()
const { pluginMetaData } = composables.usePluginMetaData()
const { getMessageFromError } = useErrors()
const { sortAlpha, objectsAreEqual } = useHelpers()

// Latest version of Plugin Select
const props = withDefaults(defineProps<{
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  disabledPlugins?: DisabledPlugin
  highlightedPluginIds?: string[]
  customPluginSupport?: CustomPluginSupportLevel
  availableOnServer?: boolean
  canDeleteCustomPlugin?: () => boolean | Promise<boolean>
  canReadCustomPlugin?: () => boolean | Promise<boolean>
  canEditCustomPlugin?: () => boolean | Promise<boolean>
  canDeleteClonedPlugin?: () => boolean | Promise<boolean>
  canReadClonedPlugin?: () => boolean | Promise<boolean>
  canEditClonedPlugin?: () => boolean | Promise<boolean>
}>(), {
  availableOnServer: true,
  customPluginSupport: 'none',
  canDeleteCustomPlugin: async () => true,
  canReadCustomPlugin: async () => true,
  canEditCustomPlugin: async () => true,
  canReadClonedPlugin: async () => true,
})

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const searchFilterInput = useTemplateRef('filter-input')

const searchFilter = ref('')
const featuredFilterCollapse = ref(false)
const groupFilterCollapse = ref(false)
const typeFilter = ref(Object.fromEntries(PluginFeaturedArray.concat(PluginGroupArraySortedAlphabetically).map(item => [item, false])))
const isLoading = ref(true)
const hasError = ref(false)
const fetchErrorMessage = ref('')
const customPluginsListError = ref('')
const availablePlugins = ref<string[]>([]) // all available plugins
const streamingCustomPlugins = ref<StreamingCustomPluginSchema[]>([])
const clonedCustomPlugins = ref<ClonedPluginSchema[]>([])
const pluginsList = ref<PluginCardList>({})
const existingEntityPlugins = ref<string[]>([])
const isListView = ref(false)
const abortController = ref<AbortController | null>(null)
const hasMounted = ref(false)
const viewModeIcon = computed(() => (isListView.value ? GridIcon : ListIcon))
const enabledClonedPlugin = inject<MaybeRef<boolean>>(PLUGIN_FEATURE_FLAGS.KM_2485_CLONED_PLUGINS, false)
const isClonedPluginFeatureEnabled = computed(() => unref(enabledClonedPlugin))

const normalizeCustomPluginSupport = (support: CustomPluginSupportLevel): Set<CustomPluginType> => {
  if (support === 'none' || support === 'disabled') {
    return new Set()
  }

  return new Set(Array.isArray(support) ? support : [support])
}

const normalizedCustomPluginSupport = computed<Set<CustomPluginType>>(() => normalizeCustomPluginSupport(props.customPluginSupport))
const customPluginSupportKey = computed(() => [...normalizedCustomPluginSupport.value].sort().join('|'))
const isStreamingCustomPluginSupported = computed(() => normalizedCustomPluginSupport.value.has('streaming'))
const isClonedCustomPluginSupported = computed(() => isClonedPluginFeatureEnabled.value && normalizedCustomPluginSupport.value.has('cloned'))

const isRequestCancelled = (error: unknown): boolean => {
  return isAxiosError(error) && error.code === 'ERR_CANCELED'
}

const isClonedPluginLicenseError = (error: unknown): boolean => {
  return getMessageFromError(error).toLowerCase().includes('requires a license')
}

const availablePluginsUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].availablePlugins}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager' && props.config.gatewayInfo?.edition === 'community') {
    return `${props.config.apiBaseUrl}${endpoints.select[props.config.app].availablePluginsForOss}`
  }

  return url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
})

const streamingPluginsUrl = computed<string | null>(() => {
  if (isStreamingCustomPluginSupported.value) {
    let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].streamingCustomPlugins}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    }

    return url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  return null
})

const clonedPluginsUrl = computed<string | null>(() => {
  if (isClonedCustomPluginSupported.value) {
    let url = `${props.config.apiBaseUrl}${endpoints.select[props.config.app].clonedPlugins}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    }

    return url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  return null
})

const fetchEntityPluginsUrl = computed((): string => {
  if (props.config.entityType && props.config.entityId) {
    let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].forEntity}`

    if (props.config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
    }

    return url
      .replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
      .replace(/{entityType}/gi, props.config.entityType || '')
      .replace(/{entityId}/gi, props.config.entityId || '')
  }

  return ''
})

const filteredPlugins = computed((): PluginCardListExtended => {
  if (!pluginsList.value) {
    return {}
  }

  const activeGroups = Object.entries(typeFilter.value)
    .filter(([, checked]) => checked)
    .map(([group]) => group)

  let filtered: PluginCardList = {}

  if (activeGroups.length === 0) {
    filtered = pluginsList.value
  }
  activeGroups.forEach(group => {
    if (pluginsList.value[group]) {
      filtered[group] = pluginsList.value[group]
    }
  })

  const query = searchFilter.value.toLowerCase()
  if (!query) {
    return filtered
  }

  const results: PluginCardList = JSON.parse(JSON.stringify(filtered))

  for (const type in filtered) {
    const matches = filtered[type]?.filter((plugin: PluginType) => {
      const fields = [
        plugin.name.toLowerCase(),
        plugin.id.toLowerCase(),
        // plugin.group.toLowerCase(),
      ]
      return fields.some(field => {
        const lcs = lcsRecursive(query, field)
        return lcs.length === query.length
      })
    }) || []
    if (!matches.length) {
      delete results[type]
    } else {
      results[type] = matches
    }
  }

  const queryResults = Object.values(results)
    .flat()
    .filter((p): p is PluginType => Boolean(p))

  // dedupe by id preserving first-seen order using Map + Array.from
  const uniqueResults = Array.from(
    queryResults.reduce((m, plugin) => {
      if (!m.has(plugin.id)) m.set(plugin.id, plugin)
      return m
    }, new Map<string, PluginType>()).values(),
  )

  return uniqueResults.length ? { 'Query Result': uniqueResults } : { }
})

const hasFilteredResults = computed((): boolean => {
  return Object.keys(filteredPlugins.value).length > 0
})

const noSearchResults = computed((): boolean => {
  return (Object.keys(pluginsList.value).length > 0 && !hasFilteredResults.value)
})

const clearTypeFilter = (): void => {
  Object.keys(typeFilter.value).forEach(key => {
    typeFilter.value[key] = false
  })
}

const buildPluginList = (): PluginCardList => {
  const clonedPluginMap = new Map(clonedCustomPlugins.value.map(p => [p.name, p]))
  const streamingPluginSet = new Set(streamingCustomPlugins.value.map(p => p.name))
  const allCustomPluginNames = new Set<string>([
    ...streamingPluginSet,
    ...clonedPluginMap.keys(),
  ])

  // If availableOnServer is false, we included unavailable plugins from pluginMeta in addition to available plugins
  // returning an array of unique plugin ids
  // either grab all plugins from metadata file or use list of available plugins provided by API
  const list = [...new Set(
    [
      ...Object.keys({ ...(!props.availableOnServer ? pluginMetaData : {}) }),
      ...availablePlugins.value,
      ...allCustomPluginNames,
    ],
  )]
    // Used to filter out ignored plugins, seems we don't need it anymore
    // Filter plugins by entity type if adding scoped plugin
    .filter((plugin: string) => {
      // For Global Plugins
      if (!props.config.entityType) {
        return plugin
      }

      const pluginName = clonedPluginMap.has(plugin) ? clonedPluginMap.get(plugin)!.ref : plugin

      if (props.config.entityType === 'services') {
        const isNotServicePlugin = (pluginMetaData[pluginName] && !pluginMetaData[pluginName].scope.includes(PluginScope.SERVICE))
        if (isNotServicePlugin) {
          return false
        }
      }

      if (props.config.entityType === 'routes') {
        const isNotRoutePlugin = (pluginMetaData[pluginName] && !pluginMetaData[pluginName].scope.includes(PluginScope.ROUTE))
        if (isNotRoutePlugin) {
          return false
        }
      }

      if (props.config.entityType === 'consumer_groups') {
        const isNotConsumerGroupPlugin = (pluginMetaData[pluginName] && !pluginMetaData[pluginName].scope.includes(PluginScope.CONSUMER_GROUP))
        if (isNotConsumerGroupPlugin) {
          return false
        }
      }

      if (props.config.entityType === 'consumers') {
        const isNotConsumerPlugin = (pluginMetaData[pluginName] && !pluginMetaData[pluginName].scope.includes(PluginScope.CONSUMER))
        if (isNotConsumerPlugin) {
          return false
        }
      }

      return plugin
    })
    // build the actual card list
    .reduce((list: PluginCardList, pluginId: string) => {
      const pluginName = (pluginMetaData[pluginId] && pluginMetaData[pluginId].name) || pluginId
      const clonedPlugin = clonedPluginMap.get(pluginId)
      const isStreamingPlugin = streamingPluginSet.has(pluginId)
      const plugin: PluginType = {
        ...pluginMetaData[pluginId],
        id: pluginId,
        name: pluginName,
        available: availablePlugins.value.includes(pluginId) || !!clonedPlugin || isStreamingPlugin,
        disabledMessage: '',
        group: pluginMetaData[pluginId]?.group || PluginGroup.CUSTOM_PLUGINS,
      }

      if (plugin.group === PluginGroup.CUSTOM_PLUGINS) {
        if (clonedPlugin) {
          plugin.customPluginType = 'cloned'
          plugin.clonedFromRef = clonedPlugin.ref
        } else if (isStreamingPlugin) {
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
    }, {})
  // Pick highlighted plugin objects from pluginMetaData and assign to 'Featured'
  // Only include plugins that passed scope filtering (i.e., already present in the list)
  if (props.highlightedPluginIds && props.highlightedPluginIds.length > 0) {
    const scopedIds = new Set(Object.values(list).flat().map(p => p?.id))
    const featuredPlugins = props.highlightedPluginIds
      .flatMap(pluginId => {
        const meta = pluginMetaData[pluginId]
        if (!meta || !scopedIds.has(pluginId)) return []
        return {
          ...meta,
          id: pluginId,
          name: meta.name || pluginId,
          available: availablePlugins.value.includes(pluginId),
          disabledMessage: props.disabledPlugins?.[pluginId] || '',
          group: meta.group || PluginGroup.CUSTOM_PLUGINS,
        }
      })
      .filter(Boolean)
    if (featuredPlugins.length > 0) {
      list[PluginGroup.FEATURED] = featuredPlugins
    }
  }
  return list
}

// race condition between fetch of available plugins and setting
// disabled/ignored plugins
// if disabled/ignored plugins changes before availablePlugins fetch
// wait for fetch to finish and don't attempt to build plugin list yet
// if disabled/ignored plugins changes AFTER availablePlugins fetch
// rebuild the list
watch(() => props.disabledPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val || {}, oldVal || {}) && !isLoading.value) {
    pluginsList.value = buildPluginList()
  }
})

watch((isLoading), (loading: boolean) => {
  emit('loading', loading)
})

const usercanEditCustomPlugin = ref(false)
const usercanDeleteCustomPlugin = ref(false)
const usercanReadCustomPlugin = ref(false)
const usercanEditClonedPlugin = ref(false)
const usercanDeleteClonedPlugin = ref(false)
const usercanReadClonedPlugin = ref(false)

const loadPermissions = async (): Promise<void> => {
  try {
    const [
      canEditCustom,
      canDeleteCustom,
      canReadCustom,
      canEditCloned,
      canDeleteCloned,
      canReadCloned,
    ] = await Promise.all([
      props.canEditCustomPlugin(),
      props.canDeleteCustomPlugin(),
      props.canReadCustomPlugin(),
      props.canEditClonedPlugin ? props.canEditClonedPlugin() : Promise.resolve(null),
      props.canDeleteClonedPlugin ? props.canDeleteClonedPlugin() : Promise.resolve(null),
      props.canReadClonedPlugin(),
    ])

    usercanEditCustomPlugin.value = canEditCustom
    usercanDeleteCustomPlugin.value = canDeleteCustom
    usercanReadCustomPlugin.value = canReadCustom
    usercanEditClonedPlugin.value = canEditCloned ?? canEditCustom
    usercanDeleteClonedPlugin.value = canDeleteCloned ?? canDeleteCustom
    usercanReadClonedPlugin.value = canReadCloned
  } catch {
    usercanEditCustomPlugin.value = false
    usercanDeleteCustomPlugin.value = false
    usercanReadCustomPlugin.value = false
    usercanEditClonedPlugin.value = false
    usercanDeleteClonedPlugin.value = false
    usercanReadClonedPlugin.value = false
  }
}

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

  if (streamingPluginsUrl.value && usercanReadCustomPlugin.value) {
    requests.push(
      fetchAllPages<StreamingCustomPluginSchema>(axiosInstance, streamingPluginsUrl.value, signal)
        .then((plugins): void => {
          streamingCustomPlugins.value = plugins
          return undefined
        })
        .catch((error) => {
          if (isRequestCancelled(error)) {
            return
          }

          if (!customPluginsListError.value) {
            customPluginsListError.value = getMessageFromError(error) ?? t('plugins.select.tabs.custom.fetch_error')
          }
        }),
    )
  }

  if (clonedPluginsUrl.value && usercanReadClonedPlugin.value) {
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

          const isLicenseError = isClonedPluginLicenseError(error)
          if (isLicenseError || !customPluginsListError.value) {
            customPluginsListError.value = isLicenseError
              ? t('plugins.select.tabs.custom.license_required')
              : getMessageFromError(error) ?? t('plugins.select.tabs.custom.fetch_error')
          }
        }),
    )
  }

  requests.push(loadEntityPlugins(signal))

  await Promise.allSettled(requests)
}

const loadPlugins = async (): Promise<void> => {
  abortController.value?.abort()
  const controller = new AbortController()
  abortController.value = controller

  isLoading.value = true
  hasError.value = false
  fetchErrorMessage.value = ''
  customPluginsListError.value = ''
  availablePlugins.value = []
  streamingCustomPlugins.value = []
  clonedCustomPlugins.value = []
  existingEntityPlugins.value = []

  try {
    const { data } = await axiosInstance.get(availablePluginsUrl.value, { signal: controller.signal })

    if (props.config.app === 'konnect') {
      const { names: allAvailablePlugins } = data
      availablePlugins.value = allAvailablePlugins || []
    } else if (props.config.app === 'kongManager') {
      const { plugins: { available_on_server: aPlugins } } = data
      availablePlugins.value = aPlugins ? Object.keys(aPlugins) : []
    }

    await loadCustomPlugins(controller.signal)
    pluginsList.value = buildPluginList()
  } catch (error: any) {
    if (!isRequestCancelled(error)) {
      hasError.value = true
      fetchErrorMessage.value = getMessageFromError(error)
    }
  } finally {
    if (abortController.value === controller && !controller.signal.aborted) {
      isLoading.value = false
    }
  }
}

const handleCustomPluginDeleteSuccess = async ({ name }: DeletedCustomPlugin): Promise<void> => {
  if (!name) {
    return
  }

  emit('delete-custom:success', name)
  await loadPlugins()
}

onMounted(async () => {
  hasMounted.value = true
  searchFilterInput.value?.input?.focus()
  await loadPermissions()
  await loadPlugins()
})

watch(
  () => [
    props.config.app === 'konnect' ? props.config.controlPlaneId : undefined,
    props.config.workspace,
    props.config.entityType,
    props.config.entityId,
    props.config.app === 'kongManager' ? props.config.gatewayInfo?.edition : undefined,
    customPluginSupportKey.value,
    isClonedPluginFeatureEnabled.value,
  ],
  async () => {
    if (hasMounted.value) {
      await loadPermissions()
      await loadPlugins()
    }
  },
)

onBeforeUnmount(() => {
  abortController.value?.abort()
})


</script>

<style lang="scss" scoped>
.plugin-catalog {
  display: flex;
  gap: var(--kui-space-90, $kui-space-90);

  .plugin-filter {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
    height: max-content;
    min-width: 280px;
    position: sticky;
    top: 24px;

    :deep(.k-collapse .collapse-heading .collapse-trigger .collapse-trigger-content) {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    }

    .plugin-filter-title {
      align-items: center;
      color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
      display: flex;
      font-size: var(--kui-font-size-40, $kui-font-size-40);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      justify-content: space-between;
      letter-spacing: var(--kui-letter-spacing-minus-20, $kui-letter-spacing-minus-20);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
    }

    .featured-title,
    .group-title {
      color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      text-transform: uppercase;
    }

    .plugin-filter-item {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: var(--kui-space-20, $kui-space-20);

      :deep(.k-checkbox .checkbox-label-wrapper .checkbox-label) {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      }
    }
  }

  .plugins-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);

    .icon-container {
      align-items: center;
      cursor: pointer;
      display: flex;
      height: var(--kui-icon-size-60, $kui-icon-size-60);
      justify-content: center;
      width: var(--kui-icon-size-60, $kui-icon-size-60);
    }

    .plugins-filter-input-container {
      align-items: center;
      display: flex;
      gap: var(--kui-space-50, $kui-space-50);

      .plugins-filter-icon {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        cursor: pointer;
        height: 24px;
        width: 24px;
      }
    }

    .custom-plugins-warning {
      margin-bottom: var(--kui-space-80, $kui-space-80);
    }
  }
}
</style>
