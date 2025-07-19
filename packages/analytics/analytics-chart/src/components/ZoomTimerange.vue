<template>
  <div class="zoom-timerange-container">
    <div class="zoom-timerange-heading">
      Selecting area:
    </div>
    <div class="zoom-timerange-details">
      <div class="start">
        Start: {{ formatTime(props.start.getTime()) }}
      </div>
      <div class="end">
        End: {{ formatTime(props.end.getTime()) }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatTime, type AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'

export interface ZoomOptions {
  label: string
  action: (newTimeRange: AbsoluteTimeRangeV4) => void
}

const props = defineProps<{
  start: Date
  end: Date
}>()
</script>

<style scoped lang="scss">
.zoom-timerange-container {
  background-color: var(--kui-color-background, $kui-color-background);
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
  padding: var(--kui-space-20, $kui-space-20);
}
</style>
