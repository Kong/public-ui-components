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
        v-if="tabs.length && !hideCustomPlugins"
        v-model="activeTab"
        data-testid="plugins-tabs"
        :tabs="tabs"
        @change="onTabsChange"
      >
        <template
          v-if="disableCustomPlugins"
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
import { computed, ref, watch, onBeforeMount, type PropType, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type DisabledPlugin,
  PluginGroup,
} from '../types'
import composables from '../composables'
import PluginCustomGrid from './custom-plugins/PluginCustomGrid.vue'
import PluginSelectGrid from './select/PluginSelectGrid.vue'
import { usePluginSelect } from '../composables/usePluginSelect'

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
  /** If true disable UIs related to custom plugins */
  disableCustomPlugins: {
    type: Boolean,
    default: false,
  },
  /** If true don't display UIs related to custom plugins */
  hideCustomPlugins: {
    type: Boolean,
    default: false,
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

const filter = ref('')

const { availableOnServer, ignoredPlugins, disabledPlugins } = toRefs(props)

const {
  isLoading,
  hasError,
  fetchErrorMessage,
  flattenPluginMap,
  filteredPlugins,
  noSearchResults,
} = usePluginSelect({
  config: props.config,
  availableOnServer,
  ignoredPlugins,
  disabledPlugins,
  filter,
})

const highlightedPlugins = computed(() => {
  return props.highlightedPluginIds.reduce((plugins, id) => {
    const plugin = flattenPluginMap.value[id]

    if (plugin && plugin.group !== PluginGroup.CUSTOM_PLUGINS) {
      plugins.push(plugin)
    }

    return plugins
  }, [] as PluginType[])
})

const tabs = props.config.app === 'konnect'
  ? [{
    hash: '#kong',
    title: t('plugins.select.tabs.kong.title'),
  },
  {
    hash: '#custom',
    title: t('plugins.select.tabs.custom.title'),
    disabled: props.disableCustomPlugins,
  }]
  : []
const activeTab = ref(tabs.length ? route?.hash || tabs[0]?.hash || '' : '')

const onTabsChange = (hash: string) => {
  router.replace({ hash, query: route.query })
}

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
