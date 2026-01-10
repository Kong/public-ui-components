<template>
  <div
    class="plugin-select-card-wrapper"
    data-testid="plugin-catalog-card-wrapper"
  >
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
            <PluginIcon
              :alt="plugin.name"
              class="plugin-card-icon"
              :name="plugin.id"
              :size="55"
            />
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
                  data-testid="edit-plugin-schema"
                  @click.stop="handleCustomEdit(plugin.name, plugin.customPluginType!)"
                >
                  {{ t('actions.edit') }}
                </KDropdownItem>
                <KDropdownItem
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
          :data-testid="`${plugin.id}-card-body`"
          :title="!plugin.available ? t('plugins.select.unavailable_tooltip') : plugin.name"
          @click="handleCustomClick"
        >
          <div
            v-if="plugin.description || (isCustomPlugin && !isCreateCustomPlugin)"
          >
            <div v-if="isCustomPlugin && !isCreateCustomPlugin">
              {{ t('plugins.select.custom_badge_text') }}
            </div>

            <div
              v-if="plugin.description"
              :title="plugin.description"
            >
              {{ plugin.description }}
            </div>
          </div>
        </div>
        <div class="plugin-card-footer">
          <div>{{ isCreateCustomPlugin ? t('actions.create_custom') : t('actions.configure') }}</div>
          <slot name="footer-extra" />
        </div>
      </a>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType) : void
  (e: 'custom-plugin-delete'): void /** internal use only */
}>()

// canDeleteCustomPlugin and canEditCustomPlugin are removed because consuming apps are not passing them down
const props = defineProps<{
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  /**
   * Plugin to display in the card
   */
  plugin: PluginType
}>()

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const controlPlaneId = computed((): string => props.config.app === 'konnect' ? props.config.controlPlaneId : '')
const isDisabled = computed((): boolean => !!(!props.plugin.available || props.plugin.disabledMessage))
const hasActions = computed((): boolean => !!(isCustomPlugin.value && !isCreateCustomPlugin.value && controlPlaneId.value))

const handleClick = (): void => {
  router.push(props.config.getCreateRoute(props.plugin.id))
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
      handleClick()
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
    line-height: $kui-line-height-40;
    min-height: 218px;
    overflow: hidden;
    padding: $kui-space-70;
    width: 100%;

    &:hover {
      box-shadow: 0 0 5px rgba(33,33,33,.2);
      text-decoration: none;
    }

    .plugin-card-header {
      display: flex;

      .plugin-card-title {
        align-items: center;
        color: $kui-color-text;
        display: flex;
        font-size: $kui-font-size-50;
        font-weight: $kui-font-weight-bold;
        gap: $kui-space-40;
        letter-spacing: $kui-letter-spacing-minus-30;
        text-align: left;
        width: 100%;

        .non-custom-title {
          text-align: left;
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
      height: $kui-icon-size-70;
      width: $kui-icon-size-70;
    }

    .plugin-card-body {
      background-color: $kui-color-background;
      -webkit-box-orient: vertical;
      color: $kui-color-text-neutral-stronger;
      display: -webkit-box;
      flex: 1;
      flex-direction: column;
      font-size: $kui-font-size-30;
      -webkit-line-clamp: 4;
      line-height: $kui-line-height-30;
      overflow: hidden;
      text-align: left;
    }

    .plugin-card-footer {
      align-items: center;
      color: $kui-color-text-primary;
      display: flex;
      font-weight: $kui-font-weight-bold;
      justify-content: space-between;
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
