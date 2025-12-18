<template>
  <div
    v-if="name"
    class="group-title"
    :data-testid="`plugin-group-${name}`"
  >
    <div class="group-icon-wrapper">
      <component
        :is="groupIcon"
        :color="KUI_COLOR_TEXT_DECORATIVE_PURPLE"
      />
    </div>

    <span class="group-title-text">{{ name }}</span>
  </div>
  <div
    ref="pluginCardContainerRef"
    class="plugin-card-container"
    :data-testid="`plugin-group-${name}`"
  >
    <PluginCatalogCard
      v-for="plugin in displayedPlugins"
      :key="`plugin-card-${plugin.id}`"
      :config="config"
      :plugin="plugin"
      @custom-plugin-delete="handleCustomPluginDelete(plugin)"
      @plugin-clicked="emit('plugin-clicked', plugin)"
    />
    <div
      v-if="showShowAllCard"
      class="show-all-plugin-card"
      @click="handleShowAll"
    >
      {{ t('plugins.select.show_all') }}
    </div>
  </div>
  <DeleteCustomPluginSchemaModal
    v-if="openDeleteModal && selectedPlugin"
    :config="config"
    :plugin="selectedPlugin"
    @closed="handleClose"
    @proceed="handleClose(true)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../../composables'
import PluginCatalogCard from './PluginCatalogCard.vue'
import DeleteCustomPluginSchemaModal from '../custom-plugins/DeleteCustomPluginSchemaModal.vue'
import type { KongManagerPluginSelectConfig, KonnectPluginSelectConfig, PluginType, CustomPluginType } from '../../types'
import { KUI_COLOR_TEXT_DECORATIVE_PURPLE } from '@kong/design-tokens'
import { AnalyticsIcon, BotIcon, CodeblockIcon, DeployIcon, LockIcon, PopularIcon, RuntimeServerlessIcon, SecurityIcon, ServiceDocumentIcon, TrafficIcon, TransformationIcon } from '@kong/icons'

const props = defineProps<{
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  /**
   * Name of the group
   */
  name?: string
  /**
   * Plugins to display in the grid
   */
  plugins: PluginType[]
}>()

const groupIcon = computed(() => {
  switch (props.name) {
    case 'Featured':
      return PopularIcon
    case 'AI':
      return BotIcon
    case 'Analytics & Monitoring':
      return AnalyticsIcon
    case 'Authentication':
      return LockIcon
    case 'Logging':
      return ServiceDocumentIcon
    case 'Security':
      return SecurityIcon
    case 'Serverless':
      return RuntimeServerlessIcon
    case 'Traffic Control':
      return TrafficIcon
    case 'Transformations':
      return TransformationIcon
    case 'Deployment':
      return DeployIcon
    case 'Custom Plugins':
      return CodeblockIcon
    default:
      return null
  }
})

const emit = defineEmits<{
  'plugin-clicked': [plugin: PluginType]
  'revalidate': []
  'delete:success': [pluginName: string]
}>()

const { i18n: { t } } = composables.useI18n()

const pluginCardContainerRef = ref<HTMLElement | null>(null)

const showAll = ref(false)

const displayedPlugins = computed(() => {
  if (!showAll.value && props.plugins.length > 9) {
    return props.plugins.slice(0, 8)
  }
  return props.plugins
})

const showShowAllCard = computed(() => !showAll.value && props.plugins.length > 9)

function handleShowAll() {
  showAll.value = true
}

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

</script>

<style lang="scss" scoped>
.group-title {
  align-items: center;
  display: flex;
  margin-bottom: $kui-space-70;

  .group-icon-wrapper {
    align-items: center;
    background-color: $kui-color-background-decorative-purple-weakest;
    border: $kui-border-width-10 solid #CFC8FF;
    border-radius: $kui-border-radius-40;
    display: flex;
    height: 36px;
    justify-content: center;
    margin-right: $kui-space-40;
    width: 36px;

    :deep(.runtime-serverless-icon svg path) {
      color: currentColor;
      fill: currentColor;
    }
  }

  .group-title-text {
    color: $kui-color-text;
    font-size: $kui-font-size-60;
    font-weight: $kui-font-weight-bold;
  }
}

.plugin-card-container {
  display: grid;
  gap: $kui-space-90;
  grid-template-columns: repeat(auto-fit, minmax(0, 335px)); // display as many cards as possible in a row, with a max width of 335px
  justify-content: start;

  @media (min-width: $kui-breakpoint-laptop) {
    justify-content: flex-start;
  }

  .show-all-plugin-card {
    align-items: center;
    border: 1px solid $kui-color-border;
    border-radius: 8px;
    color: $kui-color-text-primary;
    cursor: pointer;
    display: flex;
    font-weight: $kui-font-weight-semibold;
    height: 218px;
    justify-content: center;
  }
}
</style>
