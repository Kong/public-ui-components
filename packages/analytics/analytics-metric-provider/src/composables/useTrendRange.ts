import type { Ref } from 'vue'
import type { TimeRangeV4, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { computed } from 'vue'
import composables from '.'

// If one of our relative timeframes, we display the requested time frame (if user has trend access); otherwise fall back to one day
// Else, we have a Custom start and end datetime coming from v-calendar, so we display "vs previous X days"
export default function useTrendRange(
  withTrend: Ref<boolean>,
  timeRange?: Ref<TimeRangeV4 | undefined>,
  meta?: Ref<ExploreResultV4['meta'] | undefined>,
): Ref<string> {
  const { i18n } = composables.useI18n()

  return computed(() => {
    if (timeRange?.value?.type === 'absolute') {
      let startMs: number | undefined
      let endMs: number | undefined

      if (meta?.value?.start_ms && meta.value.end_ms) {
        startMs = meta.value.start_ms
        endMs = meta.value.end_ms
      } else if (timeRange.value.start && timeRange.value.end) {
        startMs = new Date(timeRange.value.start).getTime()
        endMs = new Date(timeRange.value.end).getTime()
      } else {
        return ''
      }

      let numDays = (endMs - startMs) / (1000 * 60 * 60 * 24)
      let numHours = (endMs - startMs) / (1000 * 60 * 60)
      let numMinutes = (endMs - startMs) / (1000 * 60)

      if (withTrend.value) {
        // If we're querying a trend, then the time range queried is doubled.
        numDays /= 2
        numHours /= 2
        numMinutes /= 2
      }

      if (numDays >= 1) {
        return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
      } else if (numHours >= 1) {
        return i18n.t('trendRange.custom_hours', { numHours: Math.round(numHours) })
      } else if (numMinutes >= 1) {
        return i18n.t('trendRange.custom_minutes', { numMinutes: Math.round(numMinutes) })
      }

      // Avoid weirdness around daylight savings time by rounding up or down to the nearest day.
      return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
    }

    // For relative time ranges, only return a value if withTrend is true
    if (timeRange?.value?.type === 'relative' && withTrend.value) {
      // @ts-ignore - dynamic i18n key
      return i18n.t(`trendRange.${timeRange.value.time_range}`)
    }

    // If we're unable to query with a trend, we can't render a meaningful trend range description.
    return ''
  })
}
