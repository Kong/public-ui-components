<template>
  <div class="plugin-select-grid">
    <KEmptyState
      v-if="!Object.keys(nonCustomPlugins).length"
      class="plugins-empty-state"
      cta-is-hidden
      icon="stateGruceo"
      icon-size="96"
    >
      <!-- this will only be shown if there are no existing Kong plugins -->
      <template #title>
        <span class="empty-state-title">
          {{ t('plugins.select.tabs.kong.empty_title') }}
        </span>
      </template>

      <template #message>
        <span class="empty-state-description">
          {{ t('plugins.select.tabs.kong.empty_description') }}
        </span>
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
import { computed, ref, type PropType } from 'vue'
import {
  PluginGroup,
  PluginGroupArray,
  PLUGIN_GROUPS_COLLAPSE_STATUS,
  type KongManagerPluginFormConfig,
  type KonnectPluginFormConfig,
  type PluginType,
  type PluginCardList,
  type TriggerLabels,
} from '../../types'
import composables from '../../composables'
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
  /**
   * Plugins to display in the grid
   */
  pluginList: {
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
  (e: 'plugin-clicked', plugin: PluginType): void
}>()

const { i18n: { t } } = composables.useI18n()
const shouldCollapsed = ref<Record<string, boolean>>(PLUGIN_GROUPS_COLLAPSE_STATUS)

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

// remove custom plugin from original pluginList
const nonCustomPlugins = computed((): PluginCardList => {
  const kongPlugins = JSON.parse(JSON.stringify(props.pluginList))

  delete kongPlugins[PluginGroup.CUSTOM_PLUGINS]

  return kongPlugins
})

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

// text for plugin group "view x more" label
const triggerLabels = computed(() => {
  return Object.keys(nonCustomPlugins.value).reduce((acc: TriggerLabels, pluginGroup: string): TriggerLabels => {
    const totalCount = getPluginCards(pluginGroup, 'all')?.length || 0
    const hiddenCount = getPluginCards(pluginGroup, 'hidden')?.length || 0

    if (totalCount > props.pluginsPerRow) {
      acc[pluginGroup as keyof TriggerLabels] = t('plugins.select.view_more', { count: hiddenCount })
    }

    return acc
  }, {})
})
</script>

<style lang="scss" scoped>
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
