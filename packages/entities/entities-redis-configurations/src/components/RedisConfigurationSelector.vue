<template>
  <div
    ref="selectEl"
    class="redis-config-select-wrap"
  >
    <KSelect
      :key="useInlineCreate && createOpen ? 'redis-select-creating' : 'redis-select'"
      class="redis-config-select-trigger"
      enable-filtering
      :filter-function="() => true"
      :items="items"
      :loading="loading"
      :model-value="useInlineCreate && createOpen ? undefined : modelValue"
      :placeholder="placeholder || t('selector.placeholder')"
      v-bind="$attrs"
      @change="onSelectionChange"
      @query-change="onQueryChange"
    >
      <template #selected-item-template="{ item }">
        <div class="selected-redis-config">
          {{ (item as SelectItem).name }}
        </div>
      </template>
      <template #item-template="{ item }">
        <div
          class="plugin-form-redis-configuration-dropdown-item"
          :data-testid="`redis-configuration-dropdown-item-${item.name}`"
        >
          <span
            class="select-item-name"
            data-testid="selected-redis-config"
          >{{ item.name }}</span>
          <!-- Omit badge when tag is unset -->
          <KBadge
            v-if="item.tag"
            appearance="info"
            class="select-item-label"
          >
            {{ item.tag }}
          </KBadge>
        </div>
      </template>
      <template #empty>
        <div
          class="empty-redis-config"
          data-testid="empty-redis-config"
        >
          {{ emptyStateText || t('selector.empty_state') }}
        </div>
      </template>
      <template
        v-if="showCreateButton"
        #dropdown-footer-text
      >
        <div
          class="new-redis-config-area"
          data-testid="new-redis-config-area"
          @click="onCreateNew"
        >
          <AddIcon :size="`var(--kui-icon-size-20, ${KUI_ICON_SIZE_20})`" />
          <span>{{ createButtonText || t('selector.create_new') }}</span>
        </div>
      </template>
    </KSelect>
  </div>

  <!-- Konnect + FF + non-cloud -->
  <div
    v-if="useInlineCreate && createOpen"
    class="redis-inline-create"
    data-testid="redis-inline-create"
  >
    <RedisConfigurationForm
      :config="inlineFormConfig"
      :disabled-partial-type="redisType === PartialType.REDIS_CE ? PartialType.REDIS_EE : PartialType.REDIS_CE"
      :slidout-top-offset="0"
      @cancel="createOpen = false"
      @error="onInlineError"
      @update="onCreated"
    />
  </div>

  <!-- KM/legacy Konnect -->
  <RedisConfigurationFormModal
    v-else-if="!useInlineCreate"
    :partial-type="redisType"
    :visible="createOpen"
    @created="onCreated"
    @modal-close="onModalClose"
    @toast="payload => emit('toast', payload)"
  />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, watch, ref } from 'vue'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { FORMS_CONFIG, shouldInlineRedisCreate } from '@kong-ui-public/forms'
import { useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { SelectItem } from '@kong/kongponents'
import { useRedisConfigurationSelector } from '../composables/useRedisConfigurationSelector'
import useI18n from '../composables/useI18n'
import RedisConfigurationForm from './RedisConfigurationForm.vue'
import RedisConfigurationFormModal from './RedisConfigurationFormModal.vue'
import { PartialType, type KonnectRedisConfigurationFormConfig, type RedisConfigurationResponse } from '../types'

import type { AxiosError } from 'axios'

defineOptions({
  inheritAttrs: false,
})

const {
  redisType = 'redis-ee',
  showCreateButton = true,
  isKonnectManagedRedisEnabled = false,
} = defineProps<{
  /** The selected redis configuration ID */
  modelValue?: string
  /** Redis type filter: 'redis-ce', 'redis-ee' */
  redisType?: 'redis-ce' | 'redis-ee'
  /** Placeholder text for the selector */
  placeholder?: string
  /** Text to show when no items are available */
  emptyStateText?: string
  /** Whether to show the create new configuration button */
  showCreateButton?: boolean
  /** Text for the create new configuration button */
  createButtonText?: string
  /** Konnect managed Redis UI (grouping, managed rows). When false- flat list for KM/ legacy Konnect */
  isKonnectManagedRedisEnabled?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the selection changes */
  'update:modelValue': [value: string | undefined]
  /** Emitted when a configuration is selected */
  'change': [item: SelectItem | null]
  /** Emitted when the create new button is clicked */
  'create-new': []
  'error-change': [error: Error | null]
  'modal-close': []
  'toast': [payload: { message: string, appearance: 'success' | 'danger' }]
}>()

const { i18n: { t } } = useI18n()
const { getMessageFromError } = useErrors()

const formConfig = inject<(KonnectBaseFormConfig | KongManagerBaseFormConfig) & {
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}>(FORMS_CONFIG)!

const useInlineCreate = computed(() => shouldInlineRedisCreate(formConfig))

const inlineFormConfig = computed(() => ({
  ...formConfig,
  cancelRoute: undefined,
  useKonnectManagedRedisUi: true,
  isCloudGateway: false,
} as KonnectRedisConfigurationFormConfig))

const {
  items,
  loading,
  onQueryChange,
  error,
  loadItems,
} = useRedisConfigurationSelector({
  redisType,
  isKonnectManagedRedisEnabled,
})

const createOpen = ref(false)
const selectEl = ref<HTMLElement | null>(null)

const onSelectionChange = (item: SelectItem<string | number> | null) => {
  // Inline create only, remount clears the select
  if (item === null) {
    if (useInlineCreate.value && createOpen.value) return
    emit('update:modelValue', undefined)
    emit('change', null)
    return
  }

  // Inline create only, picking an existing redis dismisses the form
  if (useInlineCreate.value) {
    createOpen.value = false
  }

  emit('update:modelValue', String(item.value))
  emit('change', item as SelectItem | null)
}

const onCreateNew = () => {
  createOpen.value = true
}

const onModalClose = () => {
  createOpen.value = false
  emit('modal-close')
}

const onInlineError = (error: AxiosError) => {
  emit('toast', {
    message: getMessageFromError(error),
    appearance: 'danger',
  })
}

const onCreated = (data: RedisConfigurationResponse) => {
  createOpen.value = false
  loadItems()
  onSelectionChange({
    name: data.name,
    value: data.id,
    label: data.name,
  })

  if (useInlineCreate.value) {
    emit('toast', {
      message: t('form.partial_created_success_message'),
      appearance: 'success',
    })
    // Inline form unmounts above; scroll back into view
    nextTick(() => {
      selectEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
}

watch(error, (newError) => {
  emit('error-change', newError ? new Error(String(newError)) : null)
})
</script>

<style lang="scss" scoped>
.redis-config-select-trigger {
  :deep(.k-label) {
    margin-top: 0;
  }

  .empty-redis-config {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }

  .new-redis-config-area {
    align-items: center;
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    cursor: pointer;
    display: flex;
    gap: var(--kui-space-10, $kui-space-10);
    pointer-events: auto;
  }

  .plugin-form-redis-configuration-dropdown-item {
    align-items: center;
    display: flex;
    gap: var(--kui-space-60, $kui-space-60);

    .select-item-name {
      color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
    }
  }

  .selected-redis-config {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
}

.redis-inline-create {
  margin-top: var(--kui-space-60, $kui-space-60);
}
</style>
