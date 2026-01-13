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

  const MS_PER_MINUTE = 1000 * 60
  const MS_PER_HOUR = MS_PER_MINUTE * 60
  const MS_PER_DAY = MS_PER_HOUR * 24

  const formatTimeRange = (startMs: number, endMs: number): string => {
    let duration = endMs - startMs

    // If we're querying a trend, then the time range queried is doubled
    if (withTrend.value) {
      duration /= 2
    }

    const numDays = duration / MS_PER_DAY
    const numHours = duration / MS_PER_HOUR
    const numMinutes = duration / MS_PER_MINUTE

    if (numDays >= 1) {
      return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
    } else if (numHours >= 1) {
      return i18n.t('trendRange.custom_hours', { numHours: Math.round(numHours) })
    } else if (numMinutes >= 1) {
      return i18n.t('trendRange.custom_minutes', { numMinutes: Math.round(numMinutes) })
    }

    // Avoid weirdness around daylight savings time by rounding up or down to the nearest day
    return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
  }

  const getTimestamps = (): { startMs: number, endMs: number } | undefined => {
    if (meta?.value?.start && meta.value.end) {
      return {
        startMs: new Date(meta.value.start).getTime(),
        endMs: new Date(meta.value.end).getTime(),
      }
    }

    if (timeRange?.value?.type === 'absolute' && timeRange.value.start && timeRange.value.end) {
      return {
        startMs: new Date(timeRange.value.start).getTime(),
        endMs: new Date(timeRange.value.end).getTime(),
      }
    }

    return
  }

  return computed(() => {
    if (timeRange?.value?.type === 'relative' && withTrend.value) {
      // @ts-ignore - dynamic i18n key
      return i18n.t(`trendRange.${timeRange.value.time_range}`)
    }

    if (withTrend.value || timeRange?.value?.type === 'absolute') {
      const timestamps = getTimestamps()

      if (timestamps) {
        return formatTimeRange(timestamps.startMs, timestamps.endMs)
      }
    }

    // If we're unable to query with a trend, we can't render a meaningful trend range description
    return ''
  })
}
