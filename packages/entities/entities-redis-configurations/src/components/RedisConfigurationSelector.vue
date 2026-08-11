<template>
  <KSelect
    class="redis-config-select-trigger"
    enable-filtering
    :filter-function="() => true"
    :items="items"
    :loading="loading"
    :model-value="modelValue"
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
        <span>{{ createButtonText || (useSlideout ? t('list.action_with_managed_konnect') : t('selector.create_new')) }}</span>
      </div>
    </template>
  </KSelect>

  <RedisConfigurationFormSlideout
    :partial-type="redisType"
    :visible="showSlideout"
    @close="onCreateClose"
    @created="onPartialCreated"
    @toast="payload => emit('toast', payload)"
  />

  <RedisConfigurationFormModal
    :partial-type="redisType"
    :visible="showModal"
    @created="onPartialCreated"
    @modal-close="onCreateClose"
    @toast="payload => emit('toast', payload)"
  />
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import type { SelectItem } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useRedisConfigurationSelector } from '../composables/useRedisConfigurationSelector'
import useI18n from '../composables/useI18n'
import RedisConfigurationFormModal from './RedisConfigurationFormModal.vue'
import RedisConfigurationFormSlideout from './RedisConfigurationFormSlideout.vue'
import type { RedisConfigurationResponse } from '../types'

defineOptions({
  inheritAttrs: false,
})

const {
  redisType = 'redis-ee',
  showCreateButton = true,
  isKonnectManagedRedisEnabled = false,
  modelValue,
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

const formConfig = inject(FORMS_CONFIG) as {
  app: string
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}

// Konnect + FF + non-Cloud Gateway show new managed create form in slideout; else legacy modal
const useSlideout = computed(() => (
  formConfig.app === 'konnect'
  && !!formConfig.isKonnectManagedRedisEnabled
  && formConfig.isCloudGateway !== true
))

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

const showModal = ref(false)
const showSlideout = ref(false)
// Selection before "+ New Redis"; restored if create is cancel
const prevId = ref<string>()

const onSelectionChange = (item: SelectItem<string | number> | null) => {
  emit('update:modelValue', item === null ? undefined : String(item.value))
  emit('change', item as SelectItem | null)
}

const onCreateNew = () => {
  prevId.value = modelValue
  onSelectionChange(null)
  emit('create-new')
  if (useSlideout.value) {
    showSlideout.value = true
  } else {
    showModal.value = true
  }
}

const onCreateClose = () => {
  showModal.value = false
  showSlideout.value = false

  if (prevId.value) {
    const id = prevId.value
    prevId.value = undefined
    emit('update:modelValue', id)
  }
  emit('modal-close')
}

const onPartialCreated = (data: RedisConfigurationResponse) => {
  prevId.value = undefined
  showModal.value = false
  showSlideout.value = false
  loadItems()
  onSelectionChange({
    name: data.name,
    value: data.id,
    label: data.name,
  })
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
</style>
