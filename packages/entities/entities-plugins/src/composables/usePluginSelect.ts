import { onMounted, ref, computed, toValue } from 'vue'
import { useAxios, useHelpers, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../plugins-endpoints'
import { PluginGroup, PluginScope } from '../types'

import type { MaybeRef } from 'vue'
import type { PluginType, PluginCardList, EntityType } from '../types'
import type { KongManagerConfig, KonnectConfig } from '@kong-ui-public/entities-shared'

export interface BasePluginSelectConfig {
  entityType?: EntityType
  entityId?: string
}

export interface KonnectPluginSelectConfig extends KonnectConfig, BasePluginSelectConfig { }
export interface KongManagerPluginSelectConfig extends KongManagerConfig, BasePluginSelectConfig { }

export type PluginSelectConfig = KonnectPluginSelectConfig | KongManagerPluginSelectConfig

export interface UsePluginSelectOptions {
  availableOnServer: MaybeRef<boolean>
  ignoredPlugins: MaybeRef<string[]>
  disabledPlugins: MaybeRef<Record<string, string>>
  config: PluginSelectConfig
  filter?: MaybeRef<string>
}

const getAvailablePluginsUrl = (config: PluginSelectConfig): string => {
  let url = `${config.apiBaseUrl}${endpoints.select[config.app].availablePlugins}`

  if (config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, config.controlPlaneId || '')
  } else if (config.app === 'kongManager') {
    url = config.gatewayInfo?.edition === 'community'
      ? `${config.apiBaseUrl}${endpoints.select[config.app].availablePluginsForOss}`
      : url.replace(/\/{workspace}/gi, config.workspace ? `/${config.workspace}` : '')
  }

  return url
}

const getFetchEntityPluginsUrl = (config: PluginSelectConfig): string => {
  if (config.entityType && config.entityId) {
    let url = `${config.apiBaseUrl}${endpoints.list[config.app].forEntity}`

    if (config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, config.controlPlaneId || '')
    } else if (config.app === 'kongManager') {
      url = url.replace(/\/{workspace}/gi, config.workspace ? `/${config.workspace}` : '')
    }

    return url
      .replace(/{entityType}/gi, config.entityType || '')
      .replace(/{entityId}/gi, config.entityId || '')
  }

  return ''
}

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[\s-_.]/g, '')
}

const filterPlugin = (query: string, plugin: PluginType): boolean => {
  const q = normalizeName(query)
  return (['name', 'id', 'group'] as const).some((key) => normalizeName(plugin[key]).includes(q))
}

export const usePluginSelect = ({ config, availableOnServer, ignoredPlugins, disabledPlugins, filter }: UsePluginSelectOptions) => {
  const { pluginMetaData } = composables.usePluginMetaData()
  const { i18n: { t } } = composables.useI18n()
  const { getMessageFromError } = useErrors()
  const { sortAlpha } = useHelpers()

  const isLoading = ref(true)
  const hasError = ref(false)
  const fetchErrorMessage = ref('')
  const availablePlugins = ref<string[]>([])
  const existingEntityPlugins = ref<string[]>([])

  const { axiosInstance } = useAxios(config?.axiosRequestConfig)

  const availablePluginsUrl = getAvailablePluginsUrl(config)
  const fetchEntityPluginsUrl = getFetchEntityPluginsUrl(config)

  const pluginsList = computed((): PluginCardList => {
    if (hasError.value) {
      return {}
    }

    // If availableOnServer is false, we included unavailable plugins from pluginMeta in addition to available plugins
    // returning an array of unique plugin ids
    // either grab all plugins from metadata file or use list of available plugins provided by API
    return [...new Set(
      [
        ...Object.keys({ ...(!toValue(availableOnServer) ? pluginMetaData : {}) }),
        ...availablePlugins.value,
      ],
    )]
      // Filter out ignored plugins
      .filter((plugin: string) => !toValue(ignoredPlugins).includes(plugin))
      // Filter plugins by entity type if adding scoped plugin
      .filter((plugin: string) => {
        // For Global Plugins
        if (!config.entityType) {
          return plugin
        }

        if (config.entityType === 'services') {
          const isNotServicePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.SERVICE))
          if (isNotServicePlugin) {
            return false
          }
        }

        if (config.entityType === 'routes') {
          const isNotRoutePlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.ROUTE))
          if (isNotRoutePlugin) {
            return false
          }
        }

        if (config.entityType === 'consumer_groups') {
          const isNotConsumerGroupPlugin = (pluginMetaData[plugin] && !pluginMetaData[plugin].scope.includes(PluginScope.CONSUMER_GROUP))
          if (isNotConsumerGroupPlugin) {
            return false
          }
        }

        if (config.entityType === 'consumers') {
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
        const plugin = {
          ...pluginMetaData[pluginId],
          id: pluginId,
          name: pluginName,
          available: availablePlugins.value.includes(pluginId),
          disabledMessage: '',
          group: pluginMetaData[pluginId]?.group || PluginGroup.CUSTOM_PLUGINS,
        } as PluginType

        const disabled = toValue(disabledPlugins)
        if (disabled) {
          plugin.disabledMessage = disabled[pluginId]
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
  })
  const createFlattenPluginMap = (plugins: PluginCardList): Record<string, PluginType> => {
    return Object.entries(plugins)
      .reduce((m, [, plugins]) => {
        for (const plugin of plugins) {
          m[plugin.id] = plugin
        }
        return m
      }, {} as Record<string, PluginType>)
  }

  const filteredPlugins = computed((): PluginCardList => {
    if (!pluginsList.value) {
      return {}
    }

    const query = toValue(filter || '').toLowerCase()
    const results = JSON.parse(JSON.stringify(pluginsList.value))

    for (const type in pluginsList.value) {
      const matches = pluginsList.value[type as keyof PluginCardList]?.filter((plugin: PluginType) => filterPlugin(query, plugin)) || []

      if (!matches.length) {
        delete results[type]
      } else {
        results[type] = matches
      }
    }

    return results
  })

  const flattenPluginMap = computed(() => {
    if (!pluginsList.value) {
      return {}
    }
    return createFlattenPluginMap(pluginsList.value)
  })

  const filteredFlattenPluginMap = computed(() => {
    if (!filteredPlugins.value) {
      return {}
    }
    return createFlattenPluginMap(filteredPlugins.value)
  })

  const hasFilteredResults = computed((): boolean => {
    return Object.keys(filteredPlugins.value).length > 0
  })

  const noSearchResults = computed((): boolean => {
    return (Object.keys(pluginsList.value).length > 0 && !hasFilteredResults.value)
  })

  onMounted(async () => {
    try {
      const { data } = await axiosInstance.get(availablePluginsUrl)

      // TODO: endpoints temporarily return different formats
      if (config.app === 'konnect') {
        const { names: available } = data
        availablePlugins.value = available || []
      } else if (config.app === 'kongManager') {
        const { plugins: { available_on_server: aPlugins } } = data
        availablePlugins.value = aPlugins ? Object.keys(aPlugins) : []
      }
    } catch (error: any) {
      hasError.value = true
      fetchErrorMessage.value = getMessageFromError(error)
    }

    // fetch scoped entity to check for pre-existing plugins
    if (fetchEntityPluginsUrl) {
      try {
        const { data: { data } } = await axiosInstance.get(fetchEntityPluginsUrl)

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

    isLoading.value = false
  })

  return {
    isLoading,
    hasError,
    fetchErrorMessage,
    availablePlugins,
    existingEntityPlugins,
    pluginsList,
    filteredPlugins,
    flattenPluginMap,
    filteredFlattenPluginMap,
    hasFilteredResults,
    noSearchResults,
    filterPlugin,
  }
}
