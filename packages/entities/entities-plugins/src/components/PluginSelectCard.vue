<template>
  <KTooltip
    class="plugin-card plugin-card-cursor-pointer"
    :class="{
      'disabled': !plugin.available || plugin.disabledMessage,
    }"
    :label="plugin.disabledMessage"
    position-fixed
    @click="noRouteChange ? emitPluginData() : handleCreateClick(plugin.id)"
  >
    <KCard
      class="plugin-card-content"
      :data-testid="plugin.name"
      :disabled="!plugin.available || plugin.disabledMessage"
      has-hover
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
        v-if="isCustomPlugin && controlPlaneId"
        #actions
      >
        <KDropdownMenu
          v-if="!isCreateCustomPlugin && !noRouteChange"
          :kpop-attributes="{ placement: 'bottom-end' }"
          width="150"
        >
          <template #default>
            <KButton
              class="actions-trigger"
              data-testid="overflow-actions-button"
              size="small"
            >
              <template #icon>
                <KIcon
                  :color="KUI_COLOR_TEXT_NEUTRAL_STRONGER"
                  icon="more"
                  :size="KUI_ICON_SIZE_30"
                />
              </template>
            </KButton>
          </template>

          <template #items>
            <PermissionsWrapper :auth-function="() => canEditCustom()">
              <KDropdownItem
                data-testid="edit-plugin-schema"
                @click.stop="handleCustomEdit(plugin.name)"
              >
                {{ t('actions.edit') }}
              </KDropdownItem>
            </PermissionsWrapper>
            <PermissionsWrapper :auth-function="() => canDeleteCustom()">
              <KDropdownItem
                data-testid="delete-plugin-schema"
                has-divider
                is-dangerous
                @click.stop="handleCustomDelete"
              >
                {{ t('actions.delete') }}
              </KDropdownItem>
            </PermissionsWrapper>
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
          {{ isCreateCustomPlugin ? t('actions.create_custom') : t('actions.enable') }}
        </div>
      </template>
    </KCard>
  </KTooltip>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import { PluginGroup, type KongManagerPluginFormConfig, type KonnectPluginFormConfig, type PluginType } from '../types'
import { KUI_ICON_SIZE_30, KUI_COLOR_TEXT_NEUTRAL_STRONGER } from '@kong/design-tokens'
import composables from '../composables'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'
import PluginIcon from './PluginIcon.vue'

const emit = defineEmits<{
  (e: 'plugin-clicked', plugin: PluginType) : void,
  (e: 'custom-plugin-create'): void,
  (e: 'custom-plugin-delete'): void,
}>()

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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity */
  canDeleteCustom: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEditCustom: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  plugin: {
    type: Object as PropType<PluginType>,
    required: true,
  },
  noRouteChange: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const controlPlaneId = computed((): string => props.config.app === 'konnect' ? props.config.controlPlaneId : '')

const handleCreateClick = (pluginName: string): void => {
  router.push(props.config.getCreateRoute(pluginName))
}

const emitPluginData = () => {
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
  if (props.config.app === 'konnect') {
    router.push(props.config.getCustomEditRoute(pluginName))
  }
}

// TODO: shouldn't this be router.push?
const handleCustomClick = (): void => {
  // handle custom plugin card click only
  // regular plugin card render as 'router-link' component which don't need this
  if (isCustomPlugin.value) {
    emit('custom-plugin-create')
  }
}
</script>

<style lang="scss" scoped>
.plugin-card {
  color: initial;
  display: flex;
  flex-basis: 100%;
  flex-flow: row-wrap;
  max-width: 335px;

  &.plugin-card-cursor-pointer {
    cursor: pointer;
  }

  .header-wrapper { // TODO: had to change from 2rem, does it work?
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

  :deep(.k-card-content) {
    height: 100%;
  }

  :deep(.k-plugin-card-body) {
    display: flex;
    flex-direction: column;
  }

  :deep(.k-card-header) {
    padding-left: $kui-space-60;
    padding-right: $kui-space-40;
    padding-top: $kui-space-60;
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
