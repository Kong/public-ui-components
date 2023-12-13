import type { Ref } from 'vue'
import { computed } from 'vue'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import { formatTime } from '../utils'

export default function useChartSelectedRange(chartData: Ref<AnalyticsExploreResult | AnalyticsExploreV2Result>): Ref<string> {
  const formattedTimeRange = computed(() => {
    if (!chartData.value?.meta) { return '' }

    const start = 'startMs' in chartData.value.meta ? chartData.value.meta.startMs : chartData.value.meta?.start * 1000 || ''
    const end = 'endMs' in chartData.value.meta ? chartData.value.meta.endMs : chartData.value.meta?.end * 1000 || ''

    return start && end
      ? `${formatTime(start)} - ${formatTime(end, { includeTZ: true })}`
      : ''
  })

  return formattedTimeRange
}
