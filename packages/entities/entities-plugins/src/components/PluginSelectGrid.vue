<template>
  <div>
    <template v-for="(group, idx) in pluginGroups">
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
          :trigger-label="shouldCollapsed[idx] ? triggerLabels[group] : pluginHelpText.viewLess"
        >
          <!-- If there are 4 or less, don't display a trigger -->
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
                :plugin="plugin"
                @plugin-clicked="emitPluginData"
              />
            </div>
          </template>

          <div class="plugin-card-container">
            <PluginSelectCard
              v-for="(plugin, index) in getPluginCards(nonCustomPlugins[group], 'hidden')"
              :key="index"
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
import { computed, onBeforeMount, ref, watch, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import {
  PluginGroup,
  PluginScope,
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  type KongManagerPluginFormConfig,
  type KonnectPluginFormConfig,
  type PluginType,
} from '../types'
// TODO: copy helpers over
import { sortAlpha, objectsAreEqual } from '@KHCP/helpers'
import composables from '../composables'
import PluginSelectCard from './PluginSelectCard.vue'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.createRoute || !config.cancelRoute) return false
      return true
    },
  },
  /**
    * @param {boolean} showOnlyAvailablePlugins checks kong config plugins.available_on_server and if
    * showOnlyAvailablePlugins = true, then it will not show plugins from PluginMeta that are outside
    * of the available_on_server array.
    */
  showOnlyAvailablePlugins: {
    type: Boolean,
    default: false,
  },
  noRouteChange: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'plugin-list-updated', pluginsList: PluginType[]): void
}>()

const route = useRoute()
const { i18n: { t } } = composables.useI18n()

const { pluginMetaData } = composables.usePluginMetaData()
const pluginsList = ref<PluginType[]>({})
const isLoading = ref(true)
const hasError = ref(false)

const record = ref(null)

const emitPluginData = (plugin) => {
  emit('plugin-clicked', plugin)
}
// TODO: ??
// const serviceVersionId = computed(() => String(route.params.version || ''))

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
  }

  return ''
})
const applicationRegistration = ref(null)

// TODO: what is this?
/* if (String($route.params.service || '') && String($route.params.version || '')) {
  applicationRegistration.value = composables.useApplicationRegistration(serviceVersionId)
} */

const disabledPlugins = computed(() => {
  // Usages list returns allowed plugins for `free`, plus`, and `enterprise`.
  const dPlugins = {}

  // TODO: what do we do about tiers?
  /* if (!usageData.value && !applicationRegistration.value?.status) {
    return
  }

  if (usageData.value && orgTier.value) {
    // allowedPlugins is the number of plugins available for a tier
    const allowedPlugins = usageData.value[orgTier.value]?.valid_plugins || []

    for (const aTier in usageData.value) {
      if (aTier !== orgTier.value) {
        usageData.value[aTier]?.valid_plugins?.filter(plugin => {
          if (!allowedPlugins.includes(plugin)) {
            dPlugins[plugin] = `This plugin is not supported on the ${capitalizeWord(orgTier.value)} tier.`
          }
        })
      }
    }
  } */

  // TODO: rethink this logic...
  // Maybe we need to allow passing a list of disabled plugins like KM was doing?
  if (applicationRegistration.value?.statusLabel === 'enabled') {
    const disabledTooltipText = t('plugins.select.tabs.kong.app_reg_tooltip')
    const acl = 'acl'

    dPlugins[acl] = disabledTooltipText
    dPlugins[(applicationRegistration.value.applicationRegistration.auth_config?.name)] = disabledTooltipText
  }

  return dPlugins
})

const nonCustomPlugins = computed(() => {
  // remove custom plugin from original filteredPlugins
  const kongPlugins = Object.assign({}, props.filteredPlugins)

  delete kongPlugins[PluginGroup.CUSTOM_PLUGINS]

  return kongPlugins
})

const buildPluginList = (fromWatch?: boolean) => {
  // If showOnlyAvailablePlugins is false,
  // we included unavailable plugins from pluginMeta
  // in addition to available plugins

  if (fromWatch && !record.value?.available) {
    // race condition between fetch of available plugins and setting
    // plugins disabled by tier
    // if plugins disabled by tier evaluates before record fetch
    // wait for buildPluginList() call in fetch function
    // if plugins disabled by tier evaluates AFTER record fetch
    // rebuild the list
    return
  }

  return [...new Set(
    Object.assign(
      Object.keys({ ...(!props.showOnlyAvailablePlugins && pluginMetaData) }),
      record.value.available,
    ),
  )]
    // Filter out ignored plugins
    // TODO: do I need?
    .filter(plugin => !this.pluginsToIgnore.includes(plugin))
    // Filter to just consumer plugins if adding plugin to a consumer
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
    .reduce((list: object, id: string) => {
      const pluginName = (pluginMetaData[id] && pluginMetaData[id].name) || id
      const plugin = {
        id,
        name: pluginName,
        available: record.value.available.includes(id),
        group: (pluginMetaData[id] && pluginMetaData[id].group) || PluginGroup.CUSTOM_PLUGINS,
        ...pluginMetaData[id],
      }

      if (disabledPlugins.value !== undefined) {
        plugin.disabledMessage = disabledPlugins.value[id]
      }

      if (!list[plugin.group]) {
        list[plugin.group || t('plugins.select.misc_plugins')] = []
      }

      list[plugin.group || t('plugins.select.misc_plugins')].push(plugin)

      list[plugin.group].sort(sortAlpha('name'))

      return list
    }, {})
}

// TODO: how does this fit in?
const selectedPlugin = ref(null)

// TODO: will this work?
const fetchRecord = async (): Promise<void> => {
  try {
    const { data } = await pluginServices.getAvailablePlugins()
    const { names: available } = data

    record.value = { available }
    pluginsList.value = buildPluginList()
    emit('plugin-list-updated', pluginsList.value)

    isLoading.value = false
  } catch (error) {
    hasError.value = true
    isLoading.value = false
  }
}

// TODO: move to consts
const PLUGINS_PER_ROW = 4
// TODO: is from KM, should it be passed in?
const PLUGINS_TO_IGNORE = [
  // Deprecated with release of OpenID 0.0.9
  'openid-connect-authentication',
  'openid-connect-protection',
  'openid-connect-verification',
  'vault-auth',
  'konnect-application-auth', // hide this for Kong Manager
  'kubernetes-sidecar-injector',
  'collector',
  'openwhisk',
  'upstream-tls',
]

const getPluginCards = (plugins: any[], type: 'visible' | 'hidden') => {
  if (type === 'visible') {
    return plugins.slice(0, PLUGINS_PER_ROW)
  }

  return plugins.slice(PLUGINS_PER_ROW)
}

const shouldCollapsed = ref(PLUGIN_GROUPS_COLLAPSE_STATUS)

const triggerLabels = computed(() => {
  return props.filteredPlugins
    ? Object.keys(props.filteredPlugins).reduce((acc, key) => {
      const plugins = props.filteredPlugins[key] || []

      const count = getPluginCards(plugins, 'hidden').length

      acc[key] = plugins.length > PLUGINS_PER_ROW ? t('configuration.plugins.list.viewMore', { count }) : null

      return acc
    }, {})
    : {}
})

watch(disabledPlugins, (val, oldVal) => {
  if (!objectsAreEqual(val, oldVal)) {
    pluginsList.value = buildPluginList(true)
    emit('plugin-list-updated', pluginsList.value)
  }
})

const userCanCreate = ref(false)
onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()

  fetchRecord()
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
