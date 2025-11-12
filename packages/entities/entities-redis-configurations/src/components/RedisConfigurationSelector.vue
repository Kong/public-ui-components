<template>
  <KSelect
    class="redis-config-select-trigger"
    enable-filtering
    :filter-function="() => true"
    :items="items"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="placeholder || t('selector.placeholder')"
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
        <KBadge
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
        <AddIcon :size="KUI_ICON_SIZE_20" />
        <span>{{ createButtonText || t('selector.create_new') }}</span>
      </div>
    </template>
  </KSelect>

  <!-- New Redis Configuration Modal -->
  <RedisConfigurationFormModal
    :partial-type="redisType"
    :visible="isModalVisible"
    @created="onPartialCreated"
    @modal-close="onModalClose"
    @toast="payload => emit('toast', payload)"
  />
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import type { SelectItem } from '@kong/kongponents'
import { useRedisConfigurationSelector } from '../composables/useRedisConfigurationSelector'
import useI18n from '../composables/useI18n'
import RedisConfigurationFormModal from './RedisConfigurationFormModal.vue'
import type { RedisConfigurationResponse } from '../types'

const {
  redisType = 'redis-ee',
  showCreateButton = true,
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
}>()

const emit = defineEmits<{
  /** Emitted when the selection changes */
  'update:modelValue': [value: string | undefined]
  /** Emitted when a configuration is selected */
  'change': [item: SelectItem | null]
  /** Emitted when the create new button is clicked */
  'create-new': []
  /** Emitted when an error occurs */
  'error': [error: Error]
  'error-change': [error: Error | null]
  'modal-close': []
  'toast': [payload: { message: string, appearance: 'success' | 'danger' }]
}>()

const { i18n: { t } } = useI18n()

const {
  items,
  loading,
  onQueryChange,
  error,
  loadItems,
} = useRedisConfigurationSelector({
  redisType,
})

// Modal state
const isModalVisible = ref(false)

// Event handlers
const onSelectionChange = (item: SelectItem<string> | null) => {
  const value = item?.value
  emit('update:modelValue', value as string)
  emit('change', item)
}

const onCreateNew = () => {
  isModalVisible.value = true
}

// Modal event handlers
const onModalClose = () => {
  isModalVisible.value = false
  emit('modal-close')
}

const onPartialCreated = (data: RedisConfigurationResponse) => {
  isModalVisible.value = false
  loadItems() // Refresh the list
  onSelectionChange({
    name: data.name,
    value: data.id,
    label: data.name,
  })
}

watch(error, (newError) => {
  if (newError) {
    emit('error', new Error(String(newError)))
  }
  emit('error-change', newError ? new Error(String(newError)) : null)
})
</script>

<style lang="scss" scoped>
.redis-config-select-trigger {
  :deep(.k-label) {
    margin-top: 0;
  }

  .empty-redis-config {
    color: $kui-color-text-neutral;
  }

  .new-redis-config-area {
    align-items: center;
    color: $kui-color-text-primary;
    cursor: pointer;
    display: flex;
    gap: $kui-space-10;
    pointer-events: auto;
  }

  .plugin-form-redis-configuration-dropdown-item {
    align-items: center;
    display: flex;
    gap: $kui-space-60;

    .select-item-name {
      color: $kui-color-text-neutral-stronger;
      line-height: $kui-line-height-40;
    }
  }

  .selected-redis-config {
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-40;
  }
}
</style>
