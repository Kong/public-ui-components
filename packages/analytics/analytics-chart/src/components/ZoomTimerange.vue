<template>
  <div class="zoom-timerange-container">
    <div class="zoom-timerange-heading">
      <span class="title">{{ i18n.t('new_timerange_label') }}</span>
    </div>
    <div class="zoom-timerange-details">
      <KBadge> {{ throttledStartTime }} </KBadge>
      -
      <KBadge> {{ throttledEndTime }} </KBadge>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatTime } from '@kong-ui-public/analytics-utilities'
import { KBadge } from '@kong/kongponents'
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

watch(() => [props.start, props.end], ([newStart, newEnd]) => {
  debounce(() => {
    throttledStartTime.value = formatTime(newStart.getTime())
    throttledEndTime.value = formatTime(newEnd.getTime())
  }, 100)()
}, { immediate: true })

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
