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

    <section
      aria-live="polite"
      class="plugins-results-container"
    >
      <KTabs
        v-if="tabs.length"
        v-model="activeTab"
        data-testid="plugins-tabs"
        :tabs="tabs"
        @changed="(hash: string) => $router.replace({ hash })"
      >
        <template #kong>
          <p class="tab-description">
            {{ t('plugins.select.tabs.kong.description') }}
          </p>
          <PluginSelectGrid
            :can-create="userCanCreate"
            :config="config"
            :disabled-plugins="disabledPlugins"
            :filtered-plugins="filteredPlugins"
            :ignored-plugins="ignoredPlugins"
            only-available-plugins
            @loading="(val: boolean) => $emit('loading', val)"
            @plugin-clicked="(val: PluginType) => $emit('plugin-clicked', val)"
            @plugin-list-updated="(val: PluginCardList) => pluginsList = val"
          />
        </template>

        <template #custom>
          <div>
            <p class="tab-description">
              {{ t('plugins.select.tabs.custom.description') }}
            </p>

            <PluginCustomGrid v-if="modifiedCustomPlugins.length" />

            <KEmptyState
              v-else
              class="custom-plugins-empty-state"
              cta-is-hidden
              icon="stateGruceo"
              icon-size="96"
            >
              <!-- this will only be shown if not allowed to create custom plugins -->
              <!-- TODO: use props instead-->
              <template #title>
                <span class="empty-state-title">
                  {{ t('plugins.select.tabs.custom.empty_title') }}
                </span>
              </template>

              <template #message>
                <span class="empty-state-description">
                  {{ t('plugins.select.tabs.custom.empty_description') }}
                </span>
              </template>
            </KEmptyState>
          </div>
        </template>
      </KTabs>
    </section>

    <KEmptyState
      v-if="noSearchResults"
      cta-is-hidden
      is-error
    >
      <template #message>
        <h5>
          <span v-if="filter && !hasError">{{ t('search.no_results', { filter }) }}</span>
          <span v-else-if="hasError">{{ t('errors.load_results') }}</span>
        </h5>
      </template>
    </KEmptyState>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeMount, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import type {
  DisabledPlugin,
  PluginCardList,
  KongManagerPluginFormConfig,
  KonnectPluginFormConfig,
  PluginType,
} from '../types'
import { PluginGroup } from '../types'
import composables from '../composables'
import PluginCustomGrid from './PluginCustomGrid.vue'
import PluginSelectGrid from './PluginSelectGrid.vue'

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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity */
  canCreate: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity */
  canDeleteCustom: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEditCustom: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  noRouteChange: {
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
})

defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'plugin-clicked', plugin: PluginType): void,
}>()

const route = useRoute()
const { i18n: { t } } = composables.useI18n()

const filter = ref('')
const hasError = ref(false)
const pluginsList = ref<PluginCardList>({})

const filteredPlugins = computed((): PluginCardList => {
  if (!pluginsList.value) {
    return {}
  }

  const query = filter.value.toLowerCase()
  const results = JSON.parse(JSON.stringify(pluginsList.value))

  for (const type in pluginsList.value) {
    const matches = pluginsList.value[type as keyof PluginCardList]?.filter((plugin: PluginType) => plugin.name.toLowerCase().includes(query) || plugin.group.toLowerCase().includes(query)) || []

    if (!matches.length) {
      delete results[type]
    } else {
      results[type] = matches
    }
  }

  return results
})

const hasFilteredResults = computed((): boolean => {
  return Object.keys(filteredPlugins.value).length > 0
})

const noSearchResults = computed((): boolean => {
  return (Object.keys(pluginsList.value).length > 0 && !hasFilteredResults.value)
})

const tabs = props.config.app === 'konnect'
  ? [
    {
      hash: '#kong',
      title: t('plugins.select.tabs.kong.title'),
    },
    {
      hash: '#custom',
      title: t('plugins.select.tabs.custom.title'),
    },
  ]
  : []
const activeTab = ref(tabs.length ? route.hash || tabs[0].hash : '')

const modifiedCustomPlugins = computed(() => {
  if (props.config.app === 'kongManager') {
    return []
  }

  const customPlugins = filteredPlugins.value?.[PluginGroup.CUSTOM_PLUGINS] || []

  // ADD CUSTOM_PLUGIN_CREATE as the first card if allowed creation
  return userCanCreate.value && !props.noRouteChange
    ? [{
      id: 'custom-plugin-create',
      name: t('plugins.select.tabs.custom.create.name'),
      available: true,
      group: PluginGroup.CUSTOM_PLUGINS,
      description: t('plugins.select.tabs.custom.create.description'),
    }].concat(customPlugins)
    : customPlugins
})

const userCanCreate = ref(false)
onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-select-form {
  .title-loading-skeleton {
    margin-left: $kui-space-40;
  }

  .plugins-filter-input-container {
    display: flex;

    .plugins-filter-input {
      margin-bottom: $kui-space-60;
    }
  }

  .plugins-results-container {
    margin-top: $kui-space-60;

    .tab-description {
      margin-bottom: $kui-space-80;
      margin-top: $kui-space-80;
    }
  }
}
</style>
