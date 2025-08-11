<template>
  <div class="zoom-actions-container">
    <div class="zoom-actions-heading">
      <div class="subtitle">
        {{ start }} - {{ end }}
      </div>
    </div>
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
import { formatTime, type AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { ZoomActionItem } from '../types'
import composables from '../composables'
import { computed } from 'vue'

const props = defineProps<{
  zoomActionItems: ZoomActionItem[]
  newTimeRange: AbsoluteTimeRangeV4
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

const { i18n } = composables.useI18n()
const start = computed(() => formatTime(props.newTimeRange.start.getTime()))
const end = computed(() => formatTime(props.newTimeRange.end.getTime()))

const handleAction = (option: ZoomActionItem) => {
  option.action(props.newTimeRange)
  emit('onAction')
}
</script>

<style scoped lang="scss">
@use "../styles/globals.scss" as *;

.zoom-actions-container {
  background-color: var(--kui-color-background, $kui-color-background);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  display: flex;
  flex-direction: column;

  .zoom-actions-heading {
    @include tooltipTitle;
  }

  .zoom-action-item {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    cursor: pointer;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }
  }
}
</style>
