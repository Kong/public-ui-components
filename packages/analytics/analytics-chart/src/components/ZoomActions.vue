<template>
  <div class="zoom-actions-container">
    <div
      v-for="option in zoomActionItems"
      :key="option.label"
      class="zoom-action-item"
      @click="handleAction(option)"
    >
      {{ option.label }}
    </div>
    <div
      class="zoom-action-item"
      @click="$emit('onAction')"
    >
      {{ i18n.t('zoom_action_items.cancel') }}
    </div>
  </div>
</template>
<script setup lang="ts">
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { ZoomActionItem } from '../types'
import composables from '../composables'

const props = defineProps<{
  zoomActionItems: ZoomActionItem[]
  newTimeRange: AbsoluteTimeRangeV4
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

const { i18n } = composables.useI18n()

const handleAction = (option: ZoomActionItem) => {
  option.action(props.newTimeRange)
  emit('onAction')
}
</script>

<style scoped lang="scss">
.zoom-actions-container {
  background-color: var(--kui-color-background, $kui-color-background);
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  .zoom-action-item {
    cursor: pointer;
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }
  }
}
</style>
