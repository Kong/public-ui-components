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
        class="row"
      >
        <KCollapse
          v-model="shouldCollapsed[idx]"
          class="plugins-collapse"
          :data-testid="`${group}-collapse`"
          :title="group"
          :trigger-label="!shouldCollapsed[idx] ? triggerLabels[group] : t('plugins.select.view_less')"
        >
          <!-- If there are 3 or less, don't display a trigger -->
          <template
            v-if="nonCustomPlugins[group].length <= PLUGINS_PER_ROW"
            #trigger
          >
            &nbsp;
          </template>
          <template #visible-content>
            <div class="plugin-card-container">
              <PluginSelectCard
                v-for="(plugin, index) in getPluginCards(nonCustomPlugins[group], 'visible')"
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
              v-for="(plugin, index) in getPluginCards(nonCustomPlugins[group], 'hidden')"
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
import { PLUGINS_PER_ROW } from '../constants'
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
  ignoredPlugins: {
    type: Array as PropType<String[]>,
    default: () => [],
  },
  disabledPlugins: {
    type: Object as PropType<DisabledPlugin>,
    default: () => ({}),
  },
  filteredPlugins: {
    type: Object as PropType<PluginCardList>,
    default: () => ({}),
  },
  noRouteChange: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'plugin-list-updated', pluginsList: PluginCardList): void
}>()

const route = useRoute()
const { i18n: { t } } = composables.useI18n()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const { sortAlpha, objectsAreEqual } = useHelpers()
const { getMessageFromError } = useErrors()
const { pluginMetaData } = composables.usePluginMetaData()
const availablePlugins = ref<string[]>([])
const pluginsList = ref<PluginCardList>({})
const isLoading = ref(true)
const fetchErrorMessage = ref('')

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

const entityType = computed((): string => {
  const entity = String(route.query.entity_type || '')

  if (entity) {
    return entity
  } else if (route.params.gateway_service) {
    return 'service_id'
  } else if (route.params.route) {
    return 'route_id'
  } else if (route.params.consumer) {
    return 'consumer_id'
  } else if (route.params.consumer_group) {
    return 'consumer_group_id'
  }

  return ''
})

// remove custom plugin from original filteredPlugins
const nonCustomPlugins = computed((): PluginCardList => {
  const kongPlugins = JSON.parse(JSON.stringify(props.filteredPlugins))

  delete kongPlugins[PluginGroup.CUSTOM_PLUGINS]

  return kongPlugins
})

const buildPluginList = (fromWatch?: boolean) => {
  // If onlyAvailablePlugins is false,
  // we included unavailable plugins from pluginMeta
  // in addition to available plugins

  if (fromWatch && !availablePlugins.value.length) {
    // race condition between fetch of available plugins and setting
    // plugins disabled by tier
    // if plugins disabled by tier evaluates before record fetch
    // wait for buildPluginList() call in fetch function
    // if plugins disabled by tier evaluates AFTER record fetch
    // rebuild the list
    return
  }

  // array of unique plugin_id's
  // either grab all plugins from metadata file or use list of available plugins provided by API
  return [...new Set(
    Object.assign(
      Object.keys({ ...(!props.onlyAvailablePlugins && pluginMetaData) }),
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

      const isConsumerPlugin = pluginMetaData[plugin]?.scope.includes(PluginScope.CONSUMER) ?? true

      if (isConsumerPlugin || !['consumer_id', 'developer_id'].includes(entityType.value)) {
        return plugin
      }

      return false
    })
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

      if (!list[groupName]) {
        list[groupName] = []
      }

      list[groupName].push(plugin)
      list[groupName].sort(sortAlpha('name'))

      return list
    }, {})
}

const getPluginCards = (plugins: any[], type: 'visible' | 'hidden') => {
  if (type === 'visible') {
    return plugins.slice(0, PLUGINS_PER_ROW)
  }

  return plugins.slice(PLUGINS_PER_ROW)
}

const shouldCollapsed = ref<Record<string, boolean>>(PLUGIN_GROUPS_COLLAPSE_STATUS)

const triggerLabels = computed(() => {
  return Object.keys(pluginsList.value).reduce((acc: TriggerLabels, pluginGroup: string): TriggerLabels => {
    const plugins = pluginsList.value[pluginGroup as PluginGroup] || []

    const count = getPluginCards(plugins, 'hidden').length

    if (plugins.length > PLUGINS_PER_ROW) {
      acc[pluginGroup as keyof TriggerLabels] = t('plugins.select.view_more', { count })
    }

    return acc
  }, {})
})

watch(() => props.disabledPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal)) {
    pluginsList.value = buildPluginList(true)
    emit('plugin-list-updated', pluginsList.value)
  }
})

watch(() => props.ignoredPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal)) {
    pluginsList.value = buildPluginList(true)
    emit('plugin-list-updated', pluginsList.value)
  }
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

onMounted(async () => {
  try {
    fetchErrorMessage.value = ''
    isLoading.value = true
    emit('loading', isLoading.value)

    const res = await axiosInstance.get(availablePluginsUrl.value)

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
  } finally {
    isLoading.value = false
    emit('loading', isLoading.value)
  }
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
