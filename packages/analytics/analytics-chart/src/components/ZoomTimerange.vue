<template>
  <div class="zoom-timerange-container">
    <div class="zoom-timerange-heading">
      <span class="title">Selecting area</span>
    </div>
    <div class="zoom-timerange-details">
      <KBadge> {{ formatTime(props.start.getTime()) }} </KBadge>
      -
      <KBadge> {{ formatTime(props.end.getTime()) }} </KBadge>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatTime, type AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import { KBadge } from '@kong/kongponents'

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
@use "../styles/globals.scss" as *;

.zoom-timerange-container {
  .zoom-timerange-heading {
    @include tooltipTitle;
  }

  .zoom-timerange-details {
    margin: var(--kui-space-30, $kui-space-30);
  }
}
</style>
