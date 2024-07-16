<template>
  <KCollapse
    v-model="isCollapsed"
    class="plugins-collapse"
    :data-testid="`${props.name}-collapse`"
    :title="props.name"
    :trigger-label="isCollapsed ? t('plugins.select.view_more') : t('plugins.select.view_less')"
    @toggle="setToggleVisibility"
  >
    <!-- don't display a trigger if all plugins will already be visible -->
    <template
      v-if="!showCollapseTrigger"
      #trigger
    >
      &nbsp;
    </template>

    <!-- not actually using KCollapse to hide/show content here, just using it for the trigger, title and container -->
    <!-- hiding/showing excess plugins is handled by the collapsedGroupStyles computed property -->
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
import { nextTick, ref } from 'vue'
import composables from '../../composables'
import PluginSelectCard from './PluginSelectCard.vue'
import type { KongManagerPluginSelectConfig, KonnectPluginSelectConfig, PluginType } from '../../types'
import { onMounted } from 'vue'
import { computed } from 'vue'

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

const tallestPluginCardHeight = ref<number>(310)
const pluginCardContainerRef = ref<HTMLElement | null>(null)
const pluginCardRef = ref<Array<InstanceType<typeof PluginSelectCard>> | null>(null)

const collapsedGroupStyles = computed((): Record<string, string> => {
  if (isCollapsed.value) {
    return {
      overflowY: 'hidden',
      maxHeight: `${tallestPluginCardHeight.value}px`,
    }
  }

  return {}
})
const showCollapseTrigger = ref<boolean>(false)
/**
 * Set the visibility of the collapse trigger
 * If the number of cards is greater than the number of columns displayed, show the trigger
 */
const setToggleVisibility = (): void => {
  if (pluginCardContainerRef.value && pluginCardRef.value?.length) {
    const displayedColumns = window?.getComputedStyle(pluginCardContainerRef.value)?.getPropertyValue('grid-template-columns')?.split(' ').length

    showCollapseTrigger.value = pluginCardRef.value?.length > displayedColumns
  }
}


/**
 * Set the height of the collapsed group to the height of the tallest card
 */
const setCollapsedGroupHeight = () => {
  if (pluginCardRef.value?.length) {
    let tallestCardHeight = 0
    for (let i = 0; i < pluginCardRef.value?.length; i++) {
      const card = pluginCardRef.value[i].$el
      // find height of tallest card
      tallestCardHeight = card.offsetHeight > tallestCardHeight ? card.offsetHeight : tallestCardHeight
    }

    if (tallestCardHeight > tallestPluginCardHeight.value) {
      tallestPluginCardHeight.value = tallestCardHeight
    }
  }
}

onMounted(async () => {
  await nextTick()
  setCollapsedGroupHeight()
  setToggleVisibility()
})
</script>

<style lang="scss" scoped>
.plugins-collapse {
  margin-bottom: $kui-space-90;
}

.plugin-card-container {
  display: grid;
  gap: $kui-space-90;
  grid-template-columns: repeat(auto-fit, minmax(0, 350px)); // display as many cards as possible in a row, with a max width of 350px
  justify-content: center;
  margin-top: $kui-space-90;

  @media (min-width: $kui-breakpoint-laptop) {
    justify-content: flex-start;
  }

  .plugin-card-cursor-pointer {
    cursor: pointer;
  }
}
</style>
