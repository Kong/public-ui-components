<template>
  <div class="zoom-timerange-container">
    <div class="zoom-timerange-details">
      <div
        class="label"
        data-testid="zoom-timerange-from"
      >
        {{ i18n.t('zoom_time_range.from') }}
      </div>
      <div>
        {{ throttledStartTime }}
      </div>
      <div
        class="label"
        data-testid="zoom-timerange-to"
      >
        {{ i18n.t('zoom_time_range.to') }}
      </div>
      <div>
        {{ throttledEndTime }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import { ref, watch } from 'vue'
import { debounce, formatTooltipTimestampByGranularity } from '../utils'

const props = defineProps<{
  start: Date
  end: Date
  granularity: GranularityValues
}>()

const { i18n } = composables.useI18n()
const throttledStartTime = ref(formatTooltipTimestampByGranularity({
  tickValue: props.start,
  granularity: props.granularity,
}))
const throttledEndTime = ref(formatTooltipTimestampByGranularity({
  tickValue: props.end,
  granularity: props.granularity,
}))

const updateTimeRangeDebounced = (start: Date, end: Date) => {
  debounce(() => {
    throttledStartTime.value = formatTooltipTimestampByGranularity({
      tickValue: start,
      granularity: props.granularity,
    })
    throttledEndTime.value = formatTooltipTimestampByGranularity({
      tickValue: end,
      granularity: props.granularity,
    })
  }, 100)()
}

watch(() => [props.start, props.end], ([newStart, newEnd]) => {
  if (newStart !== undefined && newEnd !== undefined) {
    updateTimeRangeDebounced(newStart, newEnd)
  }
}, { immediate: true })

</script>

<style scoped lang="scss">
.zoom-timerange-container {
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  margin: 0 var(--kui-space-20, $kui-space-20);

  .zoom-timerange-details {
    display: grid;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    gap: var(--kui-space-10, $kui-space-10);
    grid-template-columns: 35px 1fr;
    margin: var(--kui-space-30, $kui-space-30) var(--kui-space-10, $kui-space-10);

    .label {
      color: var(--kui-color-text-netural-strong, $kui-color-text-neutral-strong);
    }
  }
}
</style>
