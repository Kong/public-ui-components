<template>
  <div
    class="plugin-select-card-wrapper"
    data-testid="plugin-catalog-card-wrapper"
  >
    <KTooltip :text="plugin.disabledMessage">
      <RouterLink
        class="plugin-select-card"
        :class="{ 'disabled': isDisabled }"
        :data-testid="`${plugin.id}-card`"
        :to="pluginCardLink"
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
              @click.stop.prevent
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
                  v-if="canEditPlugin"
                  data-testid="edit-plugin-schema"
                  @click.stop.prevent="handleCustomEdit(plugin.name, plugin.customPluginType!)"
                >
                  {{ t('actions.edit') }}
                </KDropdownItem>
                <KDropdownItem
                  v-if="canDeletePlugin"
                  danger
                  data-testid="delete-plugin-schema"
                  :has-divider="canEditPlugin"
                  @click.stop.prevent="handleCustomDelete"
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
        >
          <div
            v-if="plugin.description"
            :title="plugin.description"
          >
            {{ plugin.description }}
          </div>
        </div>
        <div class="plugin-card-footer">
          <div>{{ isCreateCustomPlugin ? t('actions.create_custom') : t('actions.configure') }}</div>
          <KBadge
            v-if="footerBadgeText"
            appearance="info"
          >
            {{ footerBadgeText }}
          </KBadge>
          <KTooltip
            v-if="clonedFromText"
            :text="clonedFromText"
          >
            <KBadge
              appearance="info"
              class="cloned-from-badge"
            >
              <span class="cloned-badge-text">{{ clonedFromText }}</span>
            </KBadge>
          </KTooltip>
          <slot name="footer-extra" />
        </div>
      </RouterLink>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  PluginGroup,
  type CustomPluginType,
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCatalogPermissions,
  type PluginType,
} from '../../types'
import { PLUGIN_CATALOG_PERMISSIONS_KEY } from '../../constants'
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

const DEFAULT_PERMISSIONS: PluginCatalogPermissions = {
  canReadCustomPlugin: true,
  canUpdateCustomPlugin: true,
  canDeleteCustomPlugin: true,
  canReadClonedPlugin: true,
  canUpdateClonedPlugin: true,
  canDeleteClonedPlugin: true,
}
const injectedPerms = inject<ComputedRef<PluginCatalogPermissions>>(PLUGIN_CATALOG_PERMISSIONS_KEY)
const permissions = computed(() => injectedPerms?.value ?? DEFAULT_PERMISSIONS)

const footerBadgeText = computed((): string | null => {
  if (!isCustomPlugin.value || isCreateCustomPlugin.value) {
    return null
  }
  if (props.plugin.customPluginType === 'streaming') {
    return t('plugins.select.streamed_custom_badge')
  }
  if (props.plugin.customPluginType === 'schema') {
    return t('plugins.select.installed_custom_badge')
  }
  return null
})

const clonedFromText = computed((): string | null => {
  if (props.plugin.customPluginType === 'cloned' && props.plugin.clonedFromRef) {
    return t('plugins.select.cloned_from_badge', { link: props.plugin.clonedFromRef })
  }
  return null
})
const isDisabled = computed((): boolean => !!(!props.plugin.available || props.plugin.disabledMessage))
const hasActions = computed((): boolean => !!(isCustomPlugin.value && !isCreateCustomPlugin.value && (canEditPlugin.value || canDeletePlugin.value)))

const pluginCardLink = computed(() => {
  if (isDisabled.value) {
    return {}
  }

  if (isCustomPlugin.value) {
    if (isCreateCustomPlugin.value && props.config.createCustomRoute) {
      return props.config.createCustomRoute
    }
  }

  return props.config.getCreateRoute(props.plugin.id)
})

/**
 * Custom Plugin logic
 */
const isCreateCustomPlugin = computed((): boolean => props.plugin.id === 'custom-plugin-create')
const isCustomPlugin = computed((): boolean => (props.config.app === 'konnect' || props.config.app === 'kongManager') && props.plugin.group === PluginGroup.CUSTOM_PLUGINS)

// 'cloned' and 'schema' types are both managed via the cloned-plugins RBAC path
const isClonedType = computed(() => props.plugin.customPluginType === 'cloned' || props.plugin.customPluginType === 'schema')

const canEditPlugin = computed((): boolean => {
  if (!isCustomPlugin.value || isCreateCustomPlugin.value) return false
  // schema plugins in KM are installed plugins — not manageable, no RBAC control
  if (props.config.app === 'kongManager' && props.plugin.customPluginType === 'schema') return false
  return isClonedType.value ? permissions.value.canUpdateClonedPlugin : permissions.value.canUpdateCustomPlugin
})

const canDeletePlugin = computed((): boolean => {
  if (!isCustomPlugin.value || isCreateCustomPlugin.value) return false
  // schema plugins in KM are installed plugins — not manageable, no RBAC control
  if (props.config.app === 'kongManager' && props.plugin.customPluginType === 'schema') return false
  return isClonedType.value ? permissions.value.canDeleteClonedPlugin : permissions.value.canDeleteCustomPlugin
})

const handleCustomDelete = (): void => {
  emit('custom-plugin-delete')
}

const handleCustomEdit = (pluginName: string, type: CustomPluginType): void => {
  if (typeof props.config.getCustomEditRoute === 'function') {
    router.push(props.config.getCustomEditRoute(pluginName, type))
  }
}

</script>

<style lang="scss" scoped>
.plugin-select-card-wrapper {
  display: flex;

  .plugin-select-card {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    box-sizing: border-box;
    color: initial;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    min-height: 218px;
    overflow: hidden;
    padding: var(--kui-space-70, $kui-space-70);
    text-decoration: none;
    width: 100%;

    &:hover {
      box-shadow: 0 0 5px rgba(33,33,33,.2);
      text-decoration: none;
    }

    .plugin-card-header {
      display: flex;

      .plugin-card-title {
        align-items: center;
        color: var(--kui-color-text, $kui-color-text);
        display: flex;
        font-size: var(--kui-font-size-50, $kui-font-size-50);
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        gap: var(--kui-space-40, $kui-space-40);
        letter-spacing: var(--kui-letter-spacing-minus-30, $kui-letter-spacing-minus-30);
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
        color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      }
    }

    .plugin-card-icon {
      height: var(--kui-icon-size-70, $kui-icon-size-70);
      width: var(--kui-icon-size-70, $kui-icon-size-70);
    }

    .plugin-card-body {
      background-color: var(--kui-color-background, $kui-color-background);
      -webkit-box-orient: vertical;
      color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      display: -webkit-box;
      flex: 1;
      flex-direction: column;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      -webkit-line-clamp: 4;
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      overflow: hidden;
      text-align: left;

    }

    .plugin-card-footer {
      align-items: center;
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      display: flex;
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      justify-content: space-between;
      text-align: center;

      .cloned-badge-text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: bottom;
        white-space: nowrap;
      }
    }

    &.disabled * {
      cursor: not-allowed;
      filter: grayscale(100%);
      opacity: 0.9;
    }
  }
}
</style>
