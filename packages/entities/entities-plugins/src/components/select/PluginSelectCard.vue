<template>
  <KTooltip
    class="plugin-card plugin-card-cursor-pointer"
    :class="{
      'disabled': isDisabled,
    }"
    :label="plugin.disabledMessage"
    position-fixed
  >
    <KCard
      class="plugin-card-content"
      :data-testid="`${plugin.id}-card`"
      :disabled="isDisabled"
      has-hover
      @click="isDisabled || isCustomPlugin ? undefined : handleClick()"
    >
      <template
        v-if="isCustomPlugin"
        #statusHat
      >
        <div class="header-wrapper">
          <KBadge v-if="!isCreateCustomPlugin">
            {{ t('plugins.select.custom_badge_text') }}
          </KBadge>
        </div>
      </template>

      <template
        v-if="hasActions"
        #actions
      >
        <KDropdownMenu
          data-testid="custom-plugin-actions"
          :kpop-attributes="{ placement: 'bottomEnd' }"
          width="150"
        >
          <template #default>
            <KButton
              class="actions-trigger"
              data-testid="overflow-actions-button"
              size="small"
            >
              <template #icon>
                <MoreIcon :size="KUI_ICON_SIZE_30" />
              </template>
            </KButton>
          </template>

          <template #items>
            <KDropdownItem
              v-if="canDeleteCustomPlugin"
              data-testid="edit-plugin-schema"
              @click.stop="handleCustomEdit(plugin.name)"
            >
              {{ t('actions.edit') }}
            </KDropdownItem>
            <KDropdownItem
              v-if="canDeleteCustomPlugin"
              data-testid="delete-plugin-schema"
              has-divider
              is-dangerous
              @click.stop="handleCustomDelete"
            >
              {{ t('actions.delete') }}
            </KDropdownItem>
          </template>
        </KDropdownMenu>
      </template>

      <template #body>
        <div
          class="plugin-card-body"
          :class="{ 'custom-plugin': isCustomPlugin }"
          :title="!plugin.available ? t('plugins.select.unavailable_tooltip') : plugin.name"
          @click="handleCustomClick"
        >
          <h4 class="plugin-card-title">
            {{ plugin.name }}
          </h4>
          <PluginIcon
            :alt="plugin.name"
            class="plugin-card-icon"
            :name="plugin.imageName || plugin.id"
            :size="55"
          />
          <p
            v-if="plugin.description"
            class="plugin-card-text"
          >
            {{ plugin.description }}
          </p>
        </div>
        <div
          :class="{
            'plugin-card-create-footer': isCreateCustomPlugin,
            'plugin-card-footer': !isCreateCustomPlugin,
          }"
          @click="handleCustomClick"
        >
          {{ isCreateCustomPlugin ? t('actions.create_custom') : plugin.exists ? t('actions.enabled') : t('actions.enable') }}
        </div>
      </template>
    </KCard>
  </KTooltip>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import {
  PluginGroup,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginType,
} from '../../types'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { MoreIcon } from '@kong/icons'
import composables from '../../composables'
import PluginIcon from '../PluginIcon.vue'

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType) : void,
  (e: 'custom-plugin-delete'): void, /** internal use only */
}>()

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
  plugin: {
    type: Object as PropType<PluginType>,
    required: true,
  },
  navigateOnClick: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const controlPlaneId = computed((): string => props.config.app === 'konnect' ? props.config.controlPlaneId : '')
const isDisabled = computed((): boolean => !!(!props.plugin.available || props.plugin.disabledMessage))
const hasActions = computed((): boolean => !!(isCustomPlugin.value && !isCreateCustomPlugin.value && props.navigateOnClick && controlPlaneId.value && (props.canDeleteCustomPlugin || props.canEditCustomPlugin)))

const handleCreateClick = (): void => {
  router.push(props.config.getCreateRoute(props.plugin.id))
}

const handleClick = (): void => {
  if (!props.navigateOnClick) {
    emitPluginData()
  } else {
    handleCreateClick()
  }
}

const emitPluginData = (): void => {
  emit('plugin-clicked', props.plugin)
}

/**
 * Custom Plugin logic
 */
const isCreateCustomPlugin = computed((): boolean => props.plugin.id === 'custom-plugin-create')
const isCustomPlugin = computed((): boolean => props.config.app === 'konnect' && props.plugin.group === PluginGroup.CUSTOM_PLUGINS)

const handleCustomDelete = (): void => {
  if (props.config.app === 'konnect') {
    emit('custom-plugin-delete')
  }
}

const handleCustomEdit = (pluginName: string): void => {
  const konnectConfig = props.config as KonnectPluginSelectConfig
  if (props.config.app === 'konnect' && typeof konnectConfig.getCustomEditRoute === 'function' && konnectConfig.getCustomEditRoute) {
    router.push(konnectConfig.getCustomEditRoute(pluginName))
  }
}

const handleCustomClick = (): void => {
  // handle custom plugin card click only
  if (!isDisabled.value && props.config.app === 'konnect') {
    const konnectConfig = props.config as KonnectPluginSelectConfig
    if (isCreateCustomPlugin.value && konnectConfig.createCustomRoute) {
      router.push(konnectConfig.createCustomRoute)
    } else if (isCustomPlugin.value) {
      handleCreateClick()
    }
  }
}
</script>

<style lang="scss" scoped>
.plugin-card,
.plugin-card-content {
  color: initial;
  display: flex;
  flex-basis: 100%;
  flex-flow: row-wrap;
  max-width: 335px;

  .actions-trigger {
    color: $kui-color-text-neutral-stronger;
  }

  .header-wrapper {
    // maintain the specified height if slot has no content
    min-height: 25px;
  }

  &-title {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-medium;
    margin-bottom: $kui-space-60;
    margin-top: $kui-space-60;
  }

  &-icon {
    margin-bottom: $kui-space-60;
  }

  &-text {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-regular;
  }

  :deep(.k-card-body) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  &-body {
    background-color: $kui-color-background;
    flex: 1;
    padding: $kui-space-60;

    &.custom-plugin {
      cursor: pointer;
      padding-top: $kui-space-0;

      .plugin-card-title {
        margin-top: $kui-space-0;
      }
    }
  }

  &-footer {
    background-color: $kui-color-background-primary-weakest;
    color: $kui-color-text-primary;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-60;
  }

  &-create-footer {
    background-color: $kui-color-background-primary;
    color: $kui-color-text-inverse;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-60;
  }

  &.disabled * {
    cursor: not-allowed;
    filter: grayscale(100%);
    opacity: 0.9;
  }

  &:hover {
    text-decoration: none;
  }

  :deep(.k-card-header) {
    padding-left: $kui-space-60;
    padding-right: $kui-space-40;
    padding-top: $kui-space-60;
  }

  :deep(.k-plugin-card-body) {
    display: flex;
    flex-direction: column;
  }

  :deep(.k-card-content) {
    display: flex;
    flex: 1 !important;
    height: 100%;
  }

  :deep(.k-card-actions .k-button.outline) {
    border: none;
  }

  @media (min-width: $kui-breakpoint-phablet) {
    flex-basis: calc(50% - #{$kui-space-80});
  }

  @media (min-width: $kui-breakpoint-tablet) {
    flex-basis: calc(33.33333% - #{$kui-space-80});
  }

  @media (min-width: $kui-breakpoint-laptop) {
    flex-basis: calc(25% - #{$kui-space-80});
  }
}
</style>
