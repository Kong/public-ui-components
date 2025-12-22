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
            v-for="group in PluginGroupArray"
            :key="group"
            class="plugin-filter-item"
            :data-testid="`plugin-filter-item-${group}`"
          >
            <KCheckbox
              v-model="typeFilter[group]"
              :label="group"
            />
            <KBadge appearance="neutral">
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
            :color="KUI_ICON_COLOR_PRIMARY"
            @click="listView = !listView"
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
        <PluginCatalogListView
          v-if="listView"
          :config="config"
          :plugin-list="filteredPlugins"
          @delete:success="(name: string) => $emit('delete-custom:success', name)"
        />
        <PluginCatalogGrid
          v-else
          :config="config"
          :plugin-list="filteredPlugins"
          @delete:success="(name: string) => $emit('delete-custom:success', name)"
          @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  PluginGroup,
  PluginScope,
  PluginFeaturedArray,
  PluginGroupArray,
  type CustomPluginSupportLevel,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type DisabledPlugin,
  type PluginCardList,
  type StreamingCustomPluginSchema,
} from '../types'
import composables from '../composables'
import endpoints from '../plugins-endpoints'
import PluginCatalogGrid from './select/PluginCatalogGrid.vue'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import { KUI_ICON_COLOR_PRIMARY } from '@kong/design-tokens'
import { GridIcon, ListIcon } from '@kong/icons'
import { lcsRecursive } from '../utils/helper'
import PluginCatalogListView from './select/PluginCatalogListView.vue'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'plugin-clicked', plugin: PluginType): void
  (e: 'delete-custom:success', pluginName: string): void
}>()

type PluginCardListExtended = PluginCardList & {
  'Query Result'?: PluginType[]

}

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
}>(), {
  availableOnServer: true,
})

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const searchFilterInput = useTemplateRef('filter-input')

const searchFilter = ref('')
const featuredFilterCollapse = ref(false)
const groupFilterCollapse = ref(false)
const typeFilter = ref(Object.fromEntries(PluginFeaturedArray.concat(PluginGroupArray).map(item => [item, false])))
const isLoading = ref(true)
const hasError = ref(false)
const fetchErrorMessage = ref('')
const availablePlugins = ref<string[]>([]) // all available plugins
const streamingCustomPlugins = ref<StreamingCustomPluginSchema[]>([])
const pluginsList = ref<PluginCardList>({})
const existingEntityPlugins = ref<string[]>([])
const listView = ref(false)
const viewModeIcon = computed(() => (listView.value ? GridIcon : ListIcon))

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

const filteredPlugins = computed((): PluginCardListExtended => {
  if (!pluginsList.value) {
    return {}
  }

  const activeGroups = Object.entries(typeFilter.value)
    .filter(([_, checked]) => checked)
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
        // Only match if LCS covers at least 2/3 of the query length and is not empty
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


const buildPluginList = (): PluginCardList => {
  // If availableOnServer is false, we included unavailable plugins from pluginMeta in addition to available plugins
  // returning an array of unique plugin ids
  // either grab all plugins from metadata file or use list of available plugins provided by API
  const list = [...new Set(
    [
      ...Object.keys({ ...(!props.availableOnServer ? pluginMetaData : {}) }),
      ...availablePlugins.value,
    ],
  )]
    // Used to filter out ignored plugins, seems we don't need it anymore
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
  // Pick highlighted plugin objects from pluginMetaData and assign to 'Featured'
  if (props.highlightedPluginIds && props.highlightedPluginIds.length > 0) {
    list['Featured'] = props.highlightedPluginIds
      .flatMap(pluginId => {
        const meta = pluginMetaData[pluginId]
        if (!meta) return []
        return {
          ...meta,
          id: pluginId,
          name: meta.name || pluginId,
          available: availablePlugins.value.includes(pluginId),
          disabledMessage: props.disabledPlugins?.[pluginId] || '',
          group: meta.group || PluginGroup.CUSTOM_PLUGINS,
        }
      })
      .filter(Boolean) // remove undefined if any id not found in meta
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

onMounted(async () => {
  searchFilterInput.value?.input?.focus()

  try {
    const { data } = await axiosInstance.get(availablePluginsUrl.value)

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
    } catch {
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
.plugin-catalog {
  display: flex;
  gap: $kui-space-90;

  .plugin-filter {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    height: max-content;
    min-width: 280px;
    position: sticky;
    top: 24px;

    :deep(.k-collapse .collapse-heading .collapse-trigger .collapse-trigger-content) {
      color: $kui-color-text-neutral-strong;
    }

    .plugin-filter-title {
      color: $kui-color-text-neutral-strongest;
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-bold;
      letter-spacing: $kui-letter-spacing-minus-20;
      line-height: $kui-line-height-40;
    }

    .featured-title,
    .group-title {
      color: $kui-color-text-neutral-strongest;
      font-size: $kui-font-size-20;
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-20;
      text-transform: uppercase;
    }

    .plugin-filter-item {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: $kui-space-20;

      :deep(.k-checkbox .checkbox-label-wrapper .checkbox-label) {
        color: $kui-color-text-neutral-strong;
        font-weight: $kui-font-weight-regular;
      }
    }
  }

  .plugins-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $kui-space-60;

    .icon-container {
      align-items: center;
      cursor: pointer;
      display: flex;
      height: $kui-icon-size-60;
      justify-content: center;
      width: $kui-icon-size-60;
    }

    .plugins-filter-input-container {
      align-items: center;
      display: flex;
      gap: $kui-space-50;

      .plugins-filter-icon {
        color: $kui-color-text-neutral-strong;
        cursor: pointer;
        height: 24px;
        width: 24px;
      }
    }
  }
}
</style>
