<template>
  <div class="plugin-select-card-wrapper">
    <KTooltip :text="plugin.disabledMessage">
      <a
        class="plugin-select-card"
        :class="{ 'disabled': isDisabled }"
        :data-testid="`${plugin.id}-card`"
        role="button"
        @click="isDisabled || isCustomPlugin ? undefined : handleClick()"
      >
        <div class="plugin-card-header">
          <div class="plugin-card-title">
            <span :class="{ 'non-custom-title': !isCustomPlugin }">
              {{ plugin.name }}
            </span>
          </div>

          <div
            v-if="hasActions"
            class="plugin-card-actions"
          >
            <KDropdownMenu
              data-testid="custom-plugin-actions"
              :kpop-attributes="{ placement: 'bottom-end' }"
              width="150"
            >
              <template #default>
                <KButton
                  appearance="tertiary"
                  class="actions-trigger"
                  data-testid="overflow-actions-button"
                  icon
                  size="small"
                >
                  <MoreIcon :size="KUI_ICON_SIZE_30" />
                </KButton>
              </template>

              <template #items>
                <KDropdownItem
                  v-if="canDeleteCustomPlugin"
                  data-testid="edit-plugin-schema"
                  @click.stop="handleCustomEdit(plugin.name, plugin.customPluginType!)"
                >
                  {{ t('actions.edit') }}
                </KDropdownItem>
                <KDropdownItem
                  v-if="canDeleteCustomPlugin"
                  danger
                  data-testid="delete-plugin-schema"
                  has-divider
                  @click.stop="handleCustomDelete"
                >
                  {{ t('actions.delete') }}
                </KDropdownItem>
              </template>
            </KDropdownMenu>
          </div>
        </div>

        <div
          class="plugin-card-body"
          :class="{ 'custom-plugin': isCustomPlugin }"
          :data-testid="plugin.name"
          :title="!plugin.available ? t('plugins.select.unavailable_tooltip') : plugin.name"
          @click="handleCustomClick"
        >
          <PluginIcon
            :alt="plugin.name"
            class="plugin-card-icon"
            :name="plugin.imageName || plugin.id"
            :size="55"
          />
          <div
            v-if="plugin.description || (isCustomPlugin && !isCreateCustomPlugin)"
            class="plugin-card-text"
          >
            <p v-if="isCustomPlugin && !isCreateCustomPlugin">
              {{ t('plugins.select.custom_badge_text') }}
            </p>

            <p
              v-if="plugin.description"
              class="plugin-card-text"
              :title="plugin.description"
            >
              {{ plugin.description }}
            </p>
          </div>
        </div>
        <div
          class="plugin-card-footer"
          @click="handleCustomClick"
        >
          {{ isCreateCustomPlugin ? t('actions.create_custom') : plugin.exists ? t('actions.enabled') : t('actions.enable') }}
        </div>
      </a>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import {
  PluginGroup,
  type CustomPluginType,
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

const handleCustomEdit = (pluginName: string, type: CustomPluginType): void => {
  const konnectConfig = props.config as KonnectPluginSelectConfig
  if (props.config.app === 'konnect' && typeof konnectConfig.getCustomEditRoute === 'function' && konnectConfig.getCustomEditRoute) {
    router.push(konnectConfig.getCustomEditRoute(pluginName, type))
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
.plugin-select-card-wrapper {
  display: flex;

  .plugin-select-card {
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-30;
    box-sizing: border-box;
    color: initial;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: $kui-space-70;
    overflow: hidden;
    padding: $kui-space-70 $kui-space-70 0;
    width: 100%;

    &:hover {
      box-shadow: 0 0 5px rgba(33,33,33,.2);
      text-decoration: none;
    }

    .plugin-card-header {
      display: flex;

      .plugin-card-title {
        color: $kui-color-text;
        display: flex;
        font-size: $kui-font-size-50;
        font-weight: $kui-font-weight-bold;
        letter-spacing: $kui-letter-spacing-minus-30;
        line-height: $kui-line-height-40;
        width: 100%;

        .non-custom-title {
          text-align: center;
          width: 100%;
        }
      }

      .plugin-card-actions {
        margin-left: auto;
      }

      .actions-trigger {
        color: $kui-color-text-neutral-stronger;
      }
    }

    .plugin-card-icon {
      margin-bottom: $kui-space-60;
    }

    .plugin-card-text {
      -webkit-box-orient: vertical;
      color: $kui-color-text;
      // truncate
      display: -webkit-box;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-regular;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }

    .plugin-card-body {
      align-items: center;
      background-color: $kui-color-background;
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: $kui-space-60;

      &.custom-plugin {
        cursor: pointer;
      }
    }

    .plugin-card-footer {
      background-color: $kui-color-background-primary-weakest;
      border-radius: $kui-border-radius-30;
      color: $kui-color-text-primary;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
      margin: 0 calc(-1 * $kui-space-70);
      padding: $kui-space-60;
      text-align: center;
    }

    &.disabled * {
      cursor: not-allowed;
      filter: grayscale(100%);
      opacity: 0.9;
    }
  }
}
</style>
