<template>
  <div class="zoom-actions-container">
    <div class="zoom-actions-heading">
      <ZoomTimerange
        :end="newTimeRange.end"
        :start="newTimeRange.start"
      />
    </div>
    <div
      v-for="option in zoomActionItems"
      :key="option.label"
      class="zoom-action-item"
      :class="{ 'disabled': option.disabled }"
    >
      <a
        v-if="option.href"
        :aria-disabled="option.disabled"
        class="zoom-action-link"
        :href="option.href"
        @click="$emit('onAction')"
      >
        {{ option.label }}
      </a>
      <div
        v-else
        @click="handleAction(option)"
      >
        {{ option.label }}
      </div>
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
import ZoomTimerange from './ZoomTimerange.vue'

const props = defineProps<{
  zoomActionItems: ZoomActionItem[]
  newTimeRange: AbsoluteTimeRangeV4
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

const { i18n } = composables.useI18n()

const handleAction = (option: ZoomActionItem) => {
  if (option.action) {
    option.action(props.newTimeRange)
    emit('onAction')
  }
}
</script>

<style scoped lang="scss">

.zoom-actions-container {
  background-color: var(--kui-color-background, $kui-color-background);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  display: flex;
  flex-direction: column;

  .zoom-action-item {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    cursor: pointer;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin: 0 var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    transition: background-color 0.2s;

    .zoom-action-link {
      color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      display: block;
      text-decoration: none;
    }

    &.disabled {
      color: var(--kui-color-text-disabled, $kui-color-text-disabled);
      pointer-events: none;

      a {
        color: var(--kui-color-text-disabled, $kui-color-text-disabled);
      }
    }

    &:hover {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }
  }
}
</style>
