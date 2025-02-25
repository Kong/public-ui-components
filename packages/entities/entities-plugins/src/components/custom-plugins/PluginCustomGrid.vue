<template>
  <div class="custom-plugins-grid">
    <KEmptyState
      v-if="!modifiedCustomPlugins.length"
      :action-button-visible="false"
      class="custom-plugins-empty-state"
      icon-variant="kong"
    >
      <!-- this will only be shown if not allowed to create custom plugins -->
      <template #title>
        <span class="empty-state-title">
          {{ t('plugins.select.tabs.custom.empty_title') }}
        </span>
      </template>

      <template #default>
        <span class="empty-state-description">
          {{ t('plugins.select.tabs.custom.empty_description') }}
        </span>
      </template>
    </KEmptyState>

    <KCollapse
      v-else
      v-model="customPluginsCollapsed"
      class="custom-plugins-collapse"
      :data-testid="`${PluginGroup.CUSTOM_PLUGINS}-collapse`"
      :title="PluginGroup.CUSTOM_PLUGINS"
      :trigger-label="customPluginsCollapsed ? t('plugins.select.view_more') : t('plugins.select.view_less')"
    >
      <template
        v-if="!showCollapseTrigger"
        #trigger
      >
        &nbsp;
      </template>

      <template #visible-content>
        <div
          ref="pluginCardContainerRef"
          class="plugin-card-container"
          :style="collapsedGroupStyles"
        >
          <PluginSelectCard
            v-for="(plugin, index) in modifiedCustomPlugins"
            :key="`plugin-card-${index}`"
            ref="pluginCardRef"
            :can-delete-custom-plugin="canDeleteCustomPlugin"
            :can-edit-custom-plugin="canEditCustomPlugin"
            :config="config"
            :navigate-on-click="navigateOnClick"
            :plugin="plugin"
            @custom-plugin-delete="handleCustomPluginDelete(plugin)"
            @plugin-clicked="emitPluginData"
          />
        </div>
      </template>
    </KCollapse>

    <DeleteCustomPluginSchemaModal
      v-if="openDeleteModal && selectedPlugin"
      :config="config"
      :plugin="selectedPlugin"
      @closed="handleClose"
      @proceed="handleClose(true)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, onUnmounted } from 'vue'
import type { PropType } from 'vue'
import {
  PluginGroup,
  type CustomPluginType,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
  type PluginCardList,
} from '../../types'
import composables from '../../composables'
import PluginSelectCard from '../select/PluginSelectCard.vue'
import DeleteCustomPluginSchemaModal from './DeleteCustomPluginSchemaModal.vue'

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
  /**
   * Whether or not user has rights to create custom plugins
   */
  canCreateCustomPlugin: {
    type: Boolean,
    default: false,
  },
  /**
   * Whether or not user has rights to delete custom plugins
   */
  canDeleteCustomPlugin: {
    type: Boolean,
    default: false,
  },
  /**
   * Whether or not user has rights to edit custom plugins
   */
  canEditCustomPlugin: {
    type: Boolean,
    default: false,
  },
  /**
   * Plugins to display in the grid
   */
  pluginList: {
    type: Object as PropType<PluginCardList>,
    default: () => ({}),
  },
  /**
   * @param {boolean} navigateOnClick if false, let consuming component handle event when clicking on a plugin
   * Used in conjunction with `@plugin-clicked` event
   */
  navigateOnClick: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType): void,
  (e: 'revalidate'): void, /** internal use only */
  (e: 'delete:success', pluginName: string): void,
}>()

const { i18n: { t } } = composables.useI18n()
const { getTallestPluginCardHeight, getToggleVisibility } = composables.usePluginHelpers()

const customPluginsCollapsed = ref(true)

const emitPluginData = (plugin: PluginType) => {
  emit('plugin-clicked', plugin)
}

const modifiedCustomPlugins = computed((): PluginType[] => {
  if (props.config.app === 'kongManager') {
    return []
  }

  const customPlugins: PluginType[] = JSON.parse(JSON.stringify(props.pluginList))[PluginGroup.CUSTOM_PLUGINS] || []

  // ADD CUSTOM_PLUGIN_CREATE as the first card if allowed creation
  return props.canCreateCustomPlugin && props.navigateOnClick && props.config.createCustomRoute
    ? ([{
      id: 'custom-plugin-create',
      name: t('plugins.select.tabs.custom.create.name'),
      available: true,
      group: PluginGroup.CUSTOM_PLUGINS,
      description: t('plugins.select.tabs.custom.create.description'),
    }] as PluginType[]).concat(customPlugins)
    : customPlugins
})

const openDeleteModal = ref(false)
const selectedPlugin = ref<{ name: string, id: string, customPluginType?: CustomPluginType } | null>(null)

const handleCustomPluginDelete = (plugin: PluginType): void => {
  openDeleteModal.value = true
  selectedPlugin.value = {
    id: plugin.id,
    name: plugin.name,
    customPluginType: plugin.customPluginType,
  }
}

const handleClose = (revalidate?: boolean): void => {
  if (revalidate) {
    emit('revalidate')
    emit('delete:success', selectedPlugin.value?.name || '')
  }

  openDeleteModal.value = false
  selectedPlugin.value = null
}

const minHeight = 310
const tallestPluginCardHeight = ref<number>(minHeight) // begin with default height
const pluginCardContainerRef = ref<HTMLElement | null>(null)
const pluginCardRef = ref<Array<InstanceType<typeof PluginSelectCard>> | null>(null)

const collapsedGroupStyles = computed((): Record<string, string> => {
  // not actually using KCollapse to hide/show content here, just using it for the trigger, title and container
  // hiding/showing excess plugins is handled by these styles
  if (customPluginsCollapsed.value) {
    return {
      overflowY: 'hidden',
      maxHeight: `${tallestPluginCardHeight.value}px`,
    }
  }

  return {}
})
const showCollapseTrigger = ref<boolean>(false) // don't display a trigger if all plugins will already be visible

const handleResize = (): void => {
  tallestPluginCardHeight.value = Math.max(getTallestPluginCardHeight(pluginCardRef.value!), minHeight)
  setToggleVisibility()
}

// set the visibility of the collapse trigger
const setToggleVisibility = (): void => {
  if (pluginCardRef.value?.length) {
    showCollapseTrigger.value = getToggleVisibility(pluginCardContainerRef.value!, pluginCardRef.value?.length)
  }
}

onMounted(async () => {
  await nextTick()

  tallestPluginCardHeight.value = Math.max(getTallestPluginCardHeight(pluginCardRef.value!), minHeight)
  setToggleVisibility()
  window?.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window?.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
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

.plugins-collapse {
  margin-bottom: $kui-space-90;
}

.plugin-card-container {
  display: grid;
  gap: $kui-space-90;
  grid-template-columns: repeat(auto-fit, minmax(0, 335px)); // display as many cards as possible in a row, with a max width of 335px
  justify-content: space-around;
  margin-top: $kui-space-90;

  @media (min-width: $kui-breakpoint-laptop) {
    justify-content: flex-start;
  }
}
</style>
