<template>
  <div class="zoom-options-container">
    <div
      v-for="option in zoomOptions"
      :key="option.label"
      class="zoom-option"
      @click="handleAction(option)"
    >
      {{ option.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'

export interface ZoomOptions {
  label: string
  action: (newTimeRange: AbsoluteTimeRangeV4) => void
}

const props = defineProps<{
  zoomOptions: ZoomOptions[]
  newTimeRange: AbsoluteTimeRangeV4
}>()

const emit = defineEmits < {
  (e: 'onAction'): void
}>()

const handleAction = (option: ZoomOptions) => {
  option.action(props.newTimeRange)
  emit('onAction')
}
</script>

<style scoped lang="scss">
.zoom-options-container {
  background-color: var(--kui-color-background, $kui-color-background);
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  .zoom-option {
    cursor: pointer;
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }
  }
}
</style>
