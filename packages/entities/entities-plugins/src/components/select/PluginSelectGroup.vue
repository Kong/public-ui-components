<template>
  <KCollapse
    v-model="isCollapsed"
    class="plugins-collapse"
    :data-testid="`${props.name}-collapse`"
    :title="props.name"
    :trigger-label="isCollapsed ? triggerLabel : t('plugins.select.view_less')"
  >
    <!-- don't display a trigger if all plugins will already be visible -->
    <template
      v-if="props.plugins.length <= pluginsPerRow"
      #trigger
    >
      &nbsp;
    </template>

    <template #visible-content>
      <div class="plugin-card-container">
        <PluginSelectCard
          v-for="(plugin, index) in getPluginCards('visible', props.plugins, props.pluginsPerRow)"
          :key="`plugin-card-${index}`"
          :config="config"
          :navigate-on-click="navigateOnClick"
          :plugin="plugin"
          @plugin-clicked="emit('plugin-clicked', plugin)"
        />
      </div>
    </template>

    <div class="plugin-card-container">
      <PluginSelectCard
        v-for="(plugin, index) in getPluginCards('hidden', props.plugins, props.pluginsPerRow)"
        :key="`plugin-card-${index}`"
        :config="config"
        :navigate-on-click="navigateOnClick"
        :plugin="plugin"
        @plugin-clicked="emit('plugin-clicked', plugin)"
      />
    </div>
  </KCollapse>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import composables from '../../composables'
import PluginSelectCard from './PluginSelectCard.vue'
import type { KongManagerPluginSelectConfig, KonnectPluginSelectConfig, PluginType } from '../../types'

const isCollapsed = defineModel<boolean>({ required: true })

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
   * Name of the group
   */
  name: {
    type: String,
    required: true,
  },
  /**
   * Plugins to display in the grid
   */
  plugins: {
    type: Array as PropType<PluginType[]>,
    required: true,
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
   * Number of plugins to always have visible (never will be collapsed)
   */
  pluginsPerRow: {
    type: Number,
    default: 4,
  },
})

const emit = defineEmits<{
  'plugin-clicked': [plugin: PluginType]
}>()

const { i18n: { t } } = composables.useI18n()
const { getPluginCards } = composables.usePluginHelpers()

const triggerLabel = computed(() => {
  const totalCount = getPluginCards('all', props.plugins, props.pluginsPerRow)?.length || 0
  const hiddenCount = getPluginCards('hidden', props.plugins || [], props.pluginsPerRow)?.length || 0
  return totalCount > props.pluginsPerRow ? t('plugins.select.view_more', { count: hiddenCount }) : undefined
})
</script>

<style lang="scss" scoped>
.plugins-collapse {
  margin-bottom: $kui-space-90;
}

.plugin-card-container {
  column-gap: 50px;
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
