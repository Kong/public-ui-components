<template>
  <div class="zoom-timerange-container">
    <div class="zoom-timerange-heading">
      <div class="title">
        {{ i18n.t('new_timerange_label') }}
      </div>
    </div>
    <div class="zoom-timerange-details">
      {{ throttledStartTime }} - {{ throttledEndTime }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatTime } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import { ref, watch } from 'vue'
import { debounce } from '../utils'

const props = defineProps<{
  start: Date
  end: Date
}>()

const { i18n } = composables.useI18n()
const throttledStartTime = ref(formatTime(props.start.getTime()))
const throttledEndTime = ref(formatTime(props.end.getTime()))

const updateTimeRangeDebounced = (start: Date, end: Date) => {
  debounce(() => {
    throttledStartTime.value = formatTime(start.getTime())
    throttledEndTime.value = formatTime(end.getTime())
  }, 100)()
}

watch(() => [props.start, props.end], ([newStart, newEnd]) => {
  updateTimeRangeDebounced(newStart, newEnd)
}, { immediate: true })

</script>

<style scoped lang="scss">
@use "../styles/globals.scss" as *;

.zoom-timerange-container {
  .zoom-timerange-heading {
    @include tooltipTitle;
  }

  .zoom-timerange-details {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin: var(--kui-space-30, $kui-space-30);
  }
}
</style>
