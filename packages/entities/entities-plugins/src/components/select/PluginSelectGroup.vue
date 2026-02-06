<template>
  <KCollapse
    v-model="isCollapsed"
    class="plugins-collapse"
    :data-testid="`${props.name}-collapse`"
    :title="props.name"
    :trigger-label="isCollapsed ? t('plugins.select.view_more') : t('plugins.select.view_less')"
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
          v-for="plugin in props.plugins"
          :key="`plugin-card-${plugin.id}`"
          ref="pluginCardRef"
          :config="config"
          :navigate-on-click="navigateOnClick"
          :plugin="plugin"
          @plugin-clicked="emit('plugin-clicked', plugin)"
        />
      </div>
    </template>
  </KCollapse>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { nextTick, ref, computed, onMounted, onUnmounted } from 'vue'
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
})

const emit = defineEmits<{
  'plugin-clicked': [plugin: PluginType]
}>()

const { i18n: { t } } = composables.useI18n()
const { getTallestPluginCardHeight, getToggleVisibility } = composables.usePluginHelpers()

const minHeight = 310
const tallestPluginCardHeight = ref<number>(minHeight) // begin with default height
const pluginCardContainerRef = ref<HTMLElement | null>(null)
const pluginCardRef = ref<Array<InstanceType<typeof PluginSelectCard>> | null>(null)

const collapsedGroupStyles = computed((): Record<string, string> => {
  // not actually using KCollapse to hide/show content here, just using it for the trigger, title and container
  // hiding/showing excess plugins is handled by these styles
  if (isCollapsed.value) {
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
.plugins-collapse {
  margin-bottom: var(--kui-space-90, $kui-space-90);
}

.plugin-card-container {
  display: grid;
  gap: var(--kui-space-90, $kui-space-90);
  grid-template-columns: repeat(auto-fit, minmax(0, 335px)); // display as many cards as possible in a row, with a max width of 335px
  justify-content: space-around;
  margin-top: var(--kui-space-90, $kui-space-90);

  @media (min-width: $kui-breakpoint-laptop) {
    justify-content: flex-start;
  }

  .plugin-card-cursor-pointer {
    cursor: pointer;
  }
}
</style>
