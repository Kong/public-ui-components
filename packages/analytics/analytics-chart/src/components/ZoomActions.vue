<template>
  <div class="zoom-actions-container">
    <div class="zoom-actions-heading">
      <ZoomTimerange
        :end="newTimeRange.end"
        :start="newTimeRange.start"
      />
      <CloseIcon
        class="zoom-actions-close-icon"
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="KUI_ICON_SIZE_30"
        @click="$emit('onAction')"
      />
    </div>
    <div class="zoom-actions-heading-divider" />
    <div class="zoom-action-select">
      <div
        v-for="option in zoomActionItems"
        :key="option.key"
        class="zoom-action-item"
        :class="{ 'disabled': option.disabled }"
        :data-testid="`zoom-action-item-${option.key}`"
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
    </div>
  </div>
</template>
<script setup lang="ts">
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { ZoomActionItem } from '../types'
import ZoomTimerange from './ZoomTimerange.vue'
import { CloseIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'

const props = defineProps<{
  zoomActionItems: ZoomActionItem[]
  newTimeRange: AbsoluteTimeRangeV4
}>()

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

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
  line-height: var(--kui-line-height-20, $kui-line-height-20);

  .zoom-actions-heading {
    align-items: top;
    display: flex;

    .zoom-actions-close-icon {
      cursor: pointer;
      margin-right: var(--kui-space-30, $kui-space-30);
      margin-top: var(--kui-space-30, $kui-space-30);
    }
  }

  .zoom-actions-heading-divider {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    margin: 0 var(--kui-space-20, $kui-space-20);
  }

  .zoom-action-select {
    .zoom-action-item:first-child {
      margin-top: var(--kui-space-20, $kui-space-20);
    }
  }

  .zoom-action-item {
    color: var(--kui-color-text, $kui-color-text);
    cursor: pointer;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    transition: background-color 0.2s;

    &:last-of-type {
      border-bottom-left-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      border-bottom-right-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      margin-bottom: var(--kui-space-20, $kui-space-20)
    }

    .zoom-action-link {
      color: var(--kui-color-text, $kui-color-text);
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
      background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
    }
  }
}
</style>
