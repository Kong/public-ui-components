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
import composables from '../composables'
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { formatTooltipTimestampByGranularity } from '../utils'

const {
  start,
  end,
  granularity,
} = defineProps<{
  start: Date
  end: Date
  granularity: string
}>()

const { i18n } = composables.useI18n()
const formatTime = (tickValue: Date, granularity: string) => {
  return formatTooltipTimestampByGranularity({
    tickValue,
    granularity,
  })
}

const throttledStartTime = ref(formatTime(start, granularity))
const throttledEndTime = ref(formatTime(end, granularity))

const updateTimeRangeDebounced = useDebounceFn((
  nextStart: Date,
  nextEnd: Date,
  nextGranularity: string,
) => {
  throttledStartTime.value = formatTime(nextStart, nextGranularity)
  throttledEndTime.value = formatTime(nextEnd, nextGranularity)
}, 100)

watch(() => [start, end, granularity] as const, ([newStart, newEnd, newGranularity]) => {
  updateTimeRangeDebounced(newStart, newEnd, newGranularity)
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
      color: var(--kui-color-text-netural-strong, var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong));
    }
  }
}
</style>
